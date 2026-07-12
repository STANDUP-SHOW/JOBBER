import { loadStripe } from '@stripe/stripe-js';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

let stripePromise;
export function getStripe() {
  if (!PUBLISHABLE_KEY) return null;
  if (!stripePromise) stripePromise = loadStripe(PUBLISHABLE_KEY);
  return stripePromise;
}
