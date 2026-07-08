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

function wrap(message) {
  const err = new Error(message);
  err.status = 503;
  err.expose = true;
  return err;
}

module.exports = { stripe, createEscrowIntent, captureIntent, refundIntent };
