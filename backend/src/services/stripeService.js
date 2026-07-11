const Stripe = require('stripe');

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// The escrow effect is achieved with a PaymentIntent created with
// capture_method: 'manual'. The card is authorized when the client books,
// and only *captured* (money actually moves) once the mission is completed
// and the client confirms — this is the "money held safely" guarantee.

async function createEscrowIntent({ amountEUR, bookingId, metadata = {} }) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  return stripe.paymentIntents.create({
    amount: Math.round(amountEUR * 100),
    currency: 'eur',
    capture_method: 'manual',
    metadata: { bookingId, ...metadata },
  });
}

async function captureIntent(paymentIntentId) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  return stripe.paymentIntents.capture(paymentIntentId);
}

async function refundIntent(paymentIntentId) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  return stripe.refunds.create({ payment_intent: paymentIntentId });
}

// Stripe Connect Express: providers complete identity/bank details on
// Stripe's own hosted onboarding — Jobber never sees or stores that data,
// only the resulting account id and whether payouts are enabled.
async function createConnectAccount(email) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  return stripe.accounts.create({
    type: 'express',
    country: process.env.STRIPE_CONNECT_COUNTRY || 'BE',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

async function createAccountLink(accountId, refreshUrl, returnUrl) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

function wrap(message) {
  const err = new Error(message);
  err.status = 503;
  err.expose = true;
  return err;
}

module.exports = { stripe, createEscrowIntent, captureIntent, refundIntent, createConnectAccount, createAccountLink };
