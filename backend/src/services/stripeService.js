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

// Stripe Connect "Custom" accounts: unlike Express, nothing is collected on
// a Stripe-hosted page — identity and bank details are gathered in our own
// UI and pushed to Stripe via the API, so the jobber never leaves the app.
// The tradeoff is that Jobber (the platform) is the one presenting the ToS
// acceptance and identity info to Stripe, not Stripe's own onboarding flow.
async function upsertCustomAccount({
  accountId, email, firstName, lastName, phone,
  dobDay, dobMonth, dobYear,
  addressLine1, addressCity, addressPostalCode,
  ip,
}) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');

  // Stripe requires FR-based platforms to submit individual/business_type
  // details as a single-use account token rather than as raw fields on the
  // account itself (older accounts.create/update shape is rejected).
  const token = await stripe.tokens.create({
    account: {
      business_type: 'individual',
      individual: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        dob: { day: dobDay, month: dobMonth, year: dobYear },
        address: { line1: addressLine1, city: addressCity, postal_code: addressPostalCode, country: 'FR' },
      },
      tos_shown_and_accepted: true,
    },
  });

  const account = accountId
    ? await stripe.accounts.update(accountId, { account_token: token.id })
    : await stripe.accounts.create({
        type: 'custom',
        country: 'FR',
        email,
        account_token: token.id,
        capabilities: { transfers: { requested: true } },
        business_profile: {
          product_description: 'Services à domicile réalisés via la plateforme Jobber',
          mcc: '7299',
        },
      });

  // Record the actual person + IP that accepted the ToS, for compliance.
  return stripe.accounts.update(account.id, { tos_acceptance: { date: Math.floor(Date.now() / 1000), ip } });
}

async function setBankAccount(accountId, { iban, accountHolderName }) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  return stripe.accounts.createExternalAccount(accountId, {
    external_account: {
      object: 'bank_account',
      country: 'FR',
      currency: 'eur',
      account_holder_name: accountHolderName,
      account_number: iban,
    },
  });
}

async function retrieveAccount(accountId) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  return stripe.accounts.retrieve(accountId);
}

// Moves money from the platform's Stripe balance to the jobber's connected
// account, then immediately pays it out to their bank account.
async function payoutToProvider(accountId, amountEUR) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  const amount = Math.round(amountEUR * 100);
  const transfer = await stripe.transfers.create({ amount, currency: 'eur', destination: accountId });
  const payout = await stripe.payouts.create(
    { amount, currency: 'eur' },
    { stripeAccount: accountId }
  );
  return { transfer, payout };
}

async function createCustomer(email, name) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  return stripe.customers.create({ email, name });
}

async function createSetupIntent(customerId) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  return stripe.setupIntents.create({ customer: customerId, payment_method_types: ['card'] });
}

async function listPaymentMethods(customerId) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  const [methods, customer] = await Promise.all([
    stripe.paymentMethods.list({ customer: customerId, type: 'card' }),
    stripe.customers.retrieve(customerId),
  ]);
  const defaultId = customer.invoice_settings?.default_payment_method;
  return methods.data.map((m) => ({ ...m, isDefault: m.id === defaultId }));
}

async function detachPaymentMethod(paymentMethodId) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  return stripe.paymentMethods.detach(paymentMethodId);
}

async function setDefaultPaymentMethod(customerId, paymentMethodId) {
  if (!stripe) throw wrap('Stripe n\'est pas configuré (STRIPE_SECRET_KEY manquant)');
  return stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
}

function wrap(message) {
  const err = new Error(message);
  err.status = 503;
  err.expose = true;
  return err;
}

module.exports = {
  stripe,
  createEscrowIntent,
  captureIntent,
  refundIntent,
  upsertCustomAccount,
  setBankAccount,
  retrieveAccount,
  payoutToProvider,
  createCustomer,
  createSetupIntent,
  listPaymentMethods,
  detachPaymentMethod,
  setDefaultPaymentMethod,
};
