const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { createEscrowIntent, captureIntent, refundIntent, stripe, createConnectAccount, createAccountLink } = require('../services/stripeService');

const router = express.Router();

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

// Provider clicks "Configurer mes paiements" — creates (or reuses) a Stripe
// Connect Express account and returns a link to Stripe's hosted onboarding.
router.post('/connect/onboard', requireAuth, async (req, res, next) => {
  try {
    const profile = await prisma.providerProfile.findUnique({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ error: 'Profil prestataire introuvable' });

    let accountId = profile.stripeAccountId;
    if (!accountId) {
      const account = await createConnectAccount(req.user.email);
      accountId = account.id;
      await prisma.providerProfile.update({ where: { userId: req.user.id }, data: { stripeAccountId: accountId } });
    }

    const origin = process.env.CLIENT_ORIGIN?.split(',')[0];
    const link = await createAccountLink(
      accountId,
      `${origin}/dashboard/profile?stripe=refresh`,
      `${origin}/dashboard/profile?stripe=return`
    );
    res.json({ url: link.url });
  } catch (err) { next(err); }
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
    default:
      break;
  }

  res.json({ received: true });
};
