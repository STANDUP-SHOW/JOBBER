const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const {
  createEscrowIntent, captureIntent, refundIntent, stripe,
  upsertCustomAccount, setBankAccount, payoutToProvider,
} = require('../services/stripeService');

const router = express.Router();

// Wallet screen: missions paid out to the jobber + their withdrawal history,
// merged into one reverse-chronological list.
router.get('/wallet-history', requireAuth, async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profil prestataire introuvable' });

    const [payments, payouts] = await Promise.all([
      prisma.payment.findMany({
        where: { status: 'RELEASED', booking: { providerId: req.user.id } },
        include: { booking: { include: { mission: true, client: true } } },
        orderBy: { releasedAt: 'desc' },
      }),
      prisma.payout.findMany({ where: { providerId: profile.id }, orderBy: { createdAt: 'desc' } }),
    ]);

    const entries = [
      ...payments.map((p) => ({
        type: 'mission',
        label: p.booking.mission.title,
        subLabel: p.booking.client.firstName,
        amount: p.providerPayout,
        date: p.releasedAt,
        status: 'COMPLETED',
      })),
      ...payouts.map((p) => ({
        type: 'payout',
        label: 'Virement vers votre compte',
        subLabel: p.stripePayoutId ? `•••• ${profile.bankLast4 || ''}` : null,
        amount: -p.amount,
        date: p.createdAt,
        status: p.status,
      })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ entries });
  } catch (err) { next(err); }
});

// Step 1: client authorizes the card for the booking amount (held, not
// captured). Status only moves to HELD_IN_ESCROW once Stripe confirms the
// card was actually authorized (see the amount_capturable_updated webhook
// below) — not here, since the client could still abandon the card form.
router.post('/:bookingId/create-intent', requireAuth, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId }, include: { payment: true } });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    if (booking.clientId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    if (booking.payment?.status === 'HELD_IN_ESCROW' || booking.payment?.status === 'RELEASED') {
      return res.status(400).json({ error: 'Cette réservation est déjà payée' });
    }

    // Reuse an existing not-yet-confirmed intent instead of creating a new
    // one every time the payment form is (re)opened.
    let clientSecret;
    if (booking.payment?.stripePaymentIntentId) {
      const existing = await stripe.paymentIntents.retrieve(booking.payment.stripePaymentIntentId);
      if (existing.status === 'requires_payment_method' || existing.status === 'requires_confirmation') {
        clientSecret = existing.client_secret;
      }
    }

    if (!clientSecret) {
      const intent = await createEscrowIntent({ amountEUR: booking.totalAmount, bookingId: booking.id });
      await prisma.payment.update({ where: { bookingId: booking.id }, data: { stripePaymentIntentId: intent.id } });
      clientSecret = intent.client_secret;
    }

    res.json({ clientSecret });
  } catch (err) { next(err); }
});

// Step 2: once the client confirms the mission is done, capture the payment
// and credit the provider's in-app wallet (real payout/transfer would use
// Stripe Connect in production).
router.post('/:bookingId/release', requireAuth, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId }, include: { payment: true } });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    if (booking.clientId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    if (booking.status !== 'COMPLETED') return res.status(400).json({ error: 'La mission doit être marquée terminée avant le versement' });
    if (!booking.payment?.stripePaymentIntentId) return res.status(400).json({ error: 'Aucun paiement en attente pour cette réservation' });

    await captureIntent(booking.payment.stripePaymentIntentId);

    const [payment] = await prisma.$transaction([
      prisma.payment.update({
        where: { bookingId: booking.id },
        data: { status: 'RELEASED', paidAt: new Date(), releasedAt: new Date() },
      }),
      prisma.providerProfile.update({
        where: { userId: booking.providerId },
        data: {
          walletBalance: { increment: booking.payment.providerPayout },
          completedMissions: { increment: 1 },
        },
      }),
    ]);

    res.json({ payment });
  } catch (err) { next(err); }
});

// Cancellation refund
router.post('/:bookingId/refund', requireAuth, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.bookingId }, include: { payment: true } });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    const isParty = booking.clientId === req.user.id || booking.providerId === req.user.id;
    if (!isParty) return res.status(403).json({ error: 'Non autorisé' });
    if (!booking.payment?.stripePaymentIntentId) return res.status(400).json({ error: 'Aucun paiement à rembourser' });

    await refundIntent(booking.payment.stripePaymentIntentId);

    const [payment] = await prisma.$transaction([
      prisma.payment.update({ where: { bookingId: booking.id }, data: { status: 'REFUNDED' } }),
      prisma.booking.update({ where: { id: booking.id }, data: { status: 'CANCELLED' } }),
    ]);

    res.json({ payment });
  } catch (err) { next(err); }
});

// Jobber fills in identity + bank details directly in our own UI (no
// redirect to a Stripe-hosted page). We push everything to a Stripe Connect
// "Custom" account behind the scenes so payouts can be triggered instantly.
router.post('/connect/setup', requireAuth, async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profil prestataire introuvable' });

    const {
      firstName, lastName, phone,
      dobDay, dobMonth, dobYear,
      addressLine1, addressCity, addressPostalCode,
      iban, accountHolderName,
    } = req.body;

    if (!firstName || !lastName || !phone || !dobDay || !dobMonth || !dobYear ||
        !addressLine1 || !addressCity || !addressPostalCode || !iban || !accountHolderName) {
      return res.status(400).json({ error: 'Merci de renseigner tous les champs' });
    }

    const account = await upsertCustomAccount({
      accountId: profile.stripeAccountId || undefined,
      email: req.user.email,
      firstName, lastName, phone,
      dobDay: Number(dobDay), dobMonth: Number(dobMonth), dobYear: Number(dobYear),
      addressLine1, addressCity, addressPostalCode,
      ip: req.ip,
    });

    const bankAccount = await setBankAccount(account.id, { iban, accountHolderName });

    const updated = await prisma.providerProfile.update({
      where: { userId: req.user.id },
      data: {
        stripeAccountId: account.id,
        payoutsEnabled: !!account.payouts_enabled,
        bankLast4: bankAccount.last4,
        bankHolderName: accountHolderName,
      },
    });

    res.json({
      payoutsEnabled: updated.payoutsEnabled,
      bankLast4: updated.bankLast4,
      requirementsCurrentlyDue: account.requirements?.currently_due || [],
    });
  } catch (err) {
    if (err.type === 'StripeInvalidRequestError') {
      err.status = 400;
      err.expose = true;
    }
    next(err);
  }
});

// Jobber clicks "Virement" — moves their whole wallet balance to their bank
// account right away (Stripe transfer + payout, both triggered instantly).
router.post('/connect/payout', requireAuth, async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profil prestataire introuvable' });
    if (!profile.stripeAccountId || !profile.bankLast4) {
      return res.status(400).json({ error: 'Ajoutez d\'abord votre compte bancaire' });
    }
    if (profile.walletBalance <= 0) {
      return res.status(400).json({ error: 'Solde insuffisant' });
    }

    const amount = profile.walletBalance;
    const { transfer, payout } = await payoutToProvider(profile.stripeAccountId, amount);

    const [, payoutRecord] = await prisma.$transaction([
      prisma.providerProfile.update({ where: { userId: req.user.id }, data: { walletBalance: 0 } }),
      prisma.payout.create({
        data: {
          providerId: profile.id,
          amount,
          stripeTransferId: transfer.id,
          stripePayoutId: payout.id,
        },
      }),
    ]);

    res.json({ payout: payoutRecord });
  } catch (err) {
    if (err.type === 'StripeInvalidRequestError') {
      err.status = 400;
      err.expose = true;
    }
    next(err);
  }
});

module.exports = router;

// Stripe webhook handler — exported separately because it needs the RAW
// request body for signature verification, so it must be mounted in app.js
// with express.raw() *before* the express.json() middleware, not through
// this router (which lives behind express.json()).
module.exports.webhookHandler = async (req, res) => {
  if (!stripe) return res.status(503).end();
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook signature invalide: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: intent.id },
        data: { status: 'FAILED' },
      });
      break;
    }
    // Fired when a manual-capture PaymentIntent is successfully authorized —
    // this is the real "card confirmed, money held" moment.
    case 'payment_intent.amount_capturable_updated': {
      const intent = event.data.object;
      await prisma.payment.updateMany({
        where: { stripePaymentIntentId: intent.id, status: 'REQUIRES_PAYMENT' },
        data: { status: 'HELD_IN_ESCROW', paidAt: new Date() },
      });
      break;
    }
    case 'account.updated': {
      const account = event.data.object;
      await prisma.providerProfile.updateMany({
        where: { stripeAccountId: account.id },
        data: { payoutsEnabled: !!account.payouts_enabled },
      });
      break;
    }
    // Connect events for the jobber's bank transfer — confirms whether the
    // money actually landed, or needs to be credited back to their wallet.
    case 'payout.paid': {
      const payout = event.data.object;
      await prisma.payout.updateMany({
        where: { stripePayoutId: payout.id, status: 'PENDING' },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      break;
    }
    case 'payout.failed': {
      const payout = event.data.object;
      const record = await prisma.payout.findFirst({ where: { stripePayoutId: payout.id, status: 'PENDING' } });
      if (record) {
        await prisma.$transaction([
          prisma.payout.update({
            where: { id: record.id },
            data: { status: 'FAILED', failureReason: payout.failure_message || null },
          }),
          prisma.providerProfile.update({
            where: { id: record.providerId },
            data: { walletBalance: { increment: record.amount } },
          }),
        ]);
      }
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
};
