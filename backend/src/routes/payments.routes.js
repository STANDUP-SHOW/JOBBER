const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const {
  createEscrowIntent, captureIntent, refundIntent, stripe,
  upsertCustomAccount, setBankAccount, retrieveAccount, payoutToProvider,
  createCustomer, createSetupIntent, listPaymentMethods, detachPaymentMethod, setDefaultPaymentMethod,
  createManagerSubscription, cancelSubscription,
} = require('../services/stripeService');

const router = express.Router();

// Users type local format (06...) out of habit — Stripe requires E.164.
function toE164France(phone) {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('0')) return `+33${digits.slice(1)}`;
  return `+33${digits}`;
}

// Shared by the manual "Virement" button and auto-payout-on-release: moves
// the whole wallet balance out to the jobber's bank account right away.
async function triggerPayout(profile) {
  const amount = profile.walletBalance;
  const { transfer, payout } = await payoutToProvider(profile.stripeAccountId, amount);
  const [, payoutRecord] = await prisma.$transaction([
    prisma.providerProfile.update({ where: { id: profile.id }, data: { walletBalance: 0 } }),
    prisma.payout.create({
      data: { providerId: profile.id, amount, stripeTransferId: transfer.id, stripePayoutId: payout.id },
    }),
  ]);
  return payoutRecord;
}

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

// Annual tax certificate ("Attestation fiscale") — a real summary of what a
// manager paid through Jobber each calendar year, for them to attach to
// their own income tax return. This is NOT a télétransmission to the DGFiP:
// actually filing on someone's behalf requires platform accreditation as a
// "tiers de confiance", which is a business step, not something this builds.
router.get('/tax-summary', requireAuth, async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: 'RELEASED', booking: { clientId: req.user.id } },
      include: { booking: { include: { mission: { include: { category: true } }, provider: true } } },
      orderBy: { releasedAt: 'desc' },
    });

    const byYear = new Map();
    for (const p of payments) {
      const year = new Date(p.releasedAt).getFullYear();
      if (!byYear.has(year)) byYear.set(year, { year, totalPaid: 0, missions: [] });
      const bucket = byYear.get(year);
      bucket.totalPaid += p.amount;
      bucket.missions.push({
        title: p.booking.mission.title,
        category: p.booking.mission.category.name,
        provider: `${p.booking.provider.firstName} ${p.booking.provider.lastName?.[0] || ''}.`,
        amount: p.amount,
        date: p.releasedAt,
      });
    }

    res.json({ years: Array.from(byYear.values()).sort((a, b) => b.year - a.year) });
  } catch (err) { next(err); }
});

// "Mon solde" screen (manager side): what they've paid for missions so far.
// creditBalance itself (Cagnotte) has no funding source yet — gift cards and
// promotions aren't built — so it stays at 0 until that lands.
router.get('/spending-history', requireAuth, async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: { in: ['HELD_IN_ESCROW', 'RELEASED'] }, booking: { clientId: req.user.id } },
      include: { booking: { include: { mission: true, provider: true } } },
      orderBy: { paidAt: 'desc' },
    });

    const entries = payments.map((p) => ({
      type: 'mission',
      label: p.booking.mission.title,
      subLabel: p.booking.provider.firstName,
      amount: -p.amount,
      date: p.paidAt,
      status: p.status,
    }));

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
      // payment.amount includes the manager-side fee (or not, if waived by
      // subscription) — it's what actually gets charged, not the raw
      // jobber/manager-agreed totalAmount.
      const intent = await createEscrowIntent({ amountEUR: booking.payment.amount, bookingId: booking.id });
      await prisma.payment.update({ where: { bookingId: booking.id }, data: { stripePaymentIntentId: intent.id } });
      clientSecret = intent.client_secret;
    }

    res.json({ clientSecret, amount: booking.payment.amount });
  } catch (err) { next(err); }
});

// Step 2: once the client confirms the mission is done, capture the payment
// and credit the provider's in-app wallet (real payout/transfer would use
// Stripe Connect in production).
const REFERRAL_COMMISSION_PCT = 0.05;

router.post('/:bookingId/release', requireAuth, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.bookingId },
      include: { payment: true, client: { select: { referredById: true } } },
    });
    if (!booking) return res.status(404).json({ error: 'Réservation introuvable' });
    if (booking.clientId !== req.user.id) return res.status(403).json({ error: 'Non autorisé' });
    if (booking.status !== 'COMPLETED') return res.status(400).json({ error: 'La mission doit être marquée terminée avant le versement' });
    if (!booking.payment?.stripePaymentIntentId) return res.status(400).json({ error: 'Aucun paiement en attente pour cette réservation' });

    await captureIntent(booking.payment.stripePaymentIntentId);

    const [payment, profile] = await prisma.$transaction([
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

    // "Gagnez 5% du montant dépensé par vos amis, à vie" — credited to the
    // referrer's Cagnotte the moment their friend's payment actually lands.
    if (booking.client.referredById) {
      const commission = Math.round(payment.amount * REFERRAL_COMMISSION_PCT * 100) / 100;
      await prisma.user.update({
        where: { id: booking.client.referredById },
        data: { creditBalance: { increment: commission }, referralEarned: { increment: commission } },
      });
    }

    // "Virement automatique" — skip the manual Virement click entirely if
    // the jobber has opted in and can actually receive a payout.
    if (profile.autoPayout && profile.stripeAccountId && profile.bankLast4 && profile.payoutsEnabled && profile.walletBalance > 0) {
      try {
        await triggerPayout(profile);
      } catch (payoutErr) {
        console.error('Auto-payout failed:', payoutErr);
      }
    }

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
      firstName, lastName, phone: toE164France(phone),
      dobDay: Number(dobDay), dobMonth: Number(dobMonth), dobYear: Number(dobYear),
      addressLine1, addressCity, addressPostalCode,
      ip: req.ip,
    });

    const bankAccount = await setBankAccount(account.id, { iban, accountHolderName });
    // payouts_enabled on `account` was captured before the bank account
    // existed, so it's always stale here — re-check status now that Stripe
    // has both identity and a payout method to evaluate.
    const refreshedAccount = await retrieveAccount(account.id);

    const updated = await prisma.providerProfile.update({
      where: { userId: req.user.id },
      data: {
        stripeAccountId: account.id,
        payoutsEnabled: !!refreshedAccount.payouts_enabled,
        bankLast4: bankAccount.last4,
        bankHolderName: accountHolderName,
      },
    });

    res.json({
      payoutsEnabled: updated.payoutsEnabled,
      bankLast4: updated.bankLast4,
      requirementsCurrentlyDue: refreshedAccount.requirements?.currently_due || [],
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

    const payoutRecord = await triggerPayout(profile);

    res.json({ payout: payoutRecord });
  } catch (err) {
    if (err.type === 'StripeInvalidRequestError') {
      err.status = 400;
      err.expose = true;
    }
    next(err);
  }
});

// Saved cards (managers paying for missions) — a lightweight Stripe Customer
// wraps whatever cards they add via a SetupIntent, reused across bookings.
router.post('/setup-intent', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await createCustomer(user.email, `${user.firstName} ${user.lastName}`);
      customerId = customer.id;
      await prisma.user.update({ where: { id: req.user.id }, data: { stripeCustomerId: customerId } });
    }
    const intent = await createSetupIntent(customerId);
    res.json({ clientSecret: intent.client_secret });
  } catch (err) { next(err); }
});

router.get('/payment-methods', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.stripeCustomerId) return res.json({ paymentMethods: [] });
    const methods = await listPaymentMethods(user.stripeCustomerId);
    res.json({
      paymentMethods: methods.map((m) => ({
        id: m.id, brand: m.card.brand, last4: m.card.last4,
        expMonth: m.card.exp_month, expYear: m.card.exp_year, isDefault: m.isDefault,
      })),
    });
  } catch (err) { next(err); }
});

// Both routes below act on a Stripe object by id supplied by the client, so
// ownership must be checked server-side — otherwise any authenticated user
// could detach or default *anyone's* saved card by guessing/reusing an id.
async function assertOwnsPaymentMethod(userId, paymentMethodId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user.stripeCustomerId) return false;
  const method = await stripe.paymentMethods.retrieve(paymentMethodId);
  return method.customer === user.stripeCustomerId ? user : false;
}

router.post('/payment-methods/:id/default', requireAuth, async (req, res, next) => {
  try {
    const user = await assertOwnsPaymentMethod(req.user.id, req.params.id);
    if (!user) return res.status(404).json({ error: 'Moyen de paiement introuvable' });
    await setDefaultPaymentMethod(user.stripeCustomerId, req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/payment-methods/:id', requireAuth, async (req, res, next) => {
  try {
    const user = await assertOwnsPaymentMethod(req.user.id, req.params.id);
    if (!user) return res.status(404).json({ error: 'Moyen de paiement introuvable' });
    await detachPaymentMethod(req.params.id);
    res.status(204).end();
  } catch (err) { next(err); }
});

// "Plus aucun frais" manager plans — Manager Boss (10€/mo, up to 10 missions)
// and Manager Holder (20€/mo, unlimited). Requires a saved card first; the
// subscription's default payment method is whichever card is currently set
// as the customer's default.
router.get('/subscription', requireAuth, async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({ where: { userId: req.user.id } });
    res.json({ subscription });
  } catch (err) { next(err); }
});

router.post('/subscribe', requireAuth, async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!['MANAGER_BOSS', 'MANAGER_HOLDER'].includes(plan)) {
      return res.status(400).json({ error: 'Offre invalide' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.stripeCustomerId) {
      return res.status(400).json({ error: 'Ajoutez d\'abord un moyen de paiement' });
    }
    const methods = await listPaymentMethods(user.stripeCustomerId);
    const method = methods.find((m) => m.isDefault) || methods[0];
    if (!method) {
      return res.status(400).json({ error: 'Ajoutez d\'abord un moyen de paiement' });
    }

    const existing = await prisma.subscription.findUnique({ where: { userId: req.user.id } });
    if (existing?.stripeSubscriptionId && existing.status === 'ACTIVE') {
      await cancelSubscription(existing.stripeSubscriptionId).catch(() => {});
    }

    const stripeSub = await createManagerSubscription(user.stripeCustomerId, plan, method.id);

    const data = {
      plan,
      status: 'ACTIVE',
      stripeSubscriptionId: stripeSub.id,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      missionsUsedInPeriod: 0,
    };
    const subscription = await prisma.subscription.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, ...data },
      update: data,
    });

    res.json({ subscription });
  } catch (err) {
    if (err.type === 'StripeInvalidRequestError') {
      err.status = 400;
      err.expose = true;
    }
    next(err);
  }
});

router.post('/subscribe/cancel', requireAuth, async (req, res, next) => {
  try {
    const subscription = await prisma.subscription.findUnique({ where: { userId: req.user.id } });
    if (!subscription) return res.status(404).json({ error: 'Aucun abonnement actif' });
    if (subscription.stripeSubscriptionId) {
      await cancelSubscription(subscription.stripeSubscriptionId).catch(() => {});
    }
    const updated = await prisma.subscription.update({ where: { userId: req.user.id }, data: { status: 'CANCELED' } });
    res.json({ subscription: updated });
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
    // Subscription lifecycle — keeps period dates and status in sync, and
    // resets the monthly mission quota exactly when Stripe renews billing
    // rather than on some approximate date we'd compute ourselves.
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription },
          data: { missionsUsedInPeriod: 0, status: 'ACTIVE' },
        });
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      if (invoice.subscription) {
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: invoice.subscription },
          data: { status: 'PAST_DUE' },
        });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          status: sub.status === 'active' ? 'ACTIVE' : sub.status === 'past_due' ? 'PAST_DUE' : 'CANCELED',
        },
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { status: 'CANCELED' },
      });
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
};
