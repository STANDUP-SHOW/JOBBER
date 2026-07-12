'use client';

import { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '../lib/stripe';
import { api } from '../lib/api';

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#111114',
      '::placeholder': { color: '#8E8E93' },
    },
    invalid: { color: '#E63950' },
  },
};

function CheckoutForm({ booking, token, onClose, onPaid }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [succeeded, setSucceeded] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError('');
    try {
      const { clientSecret } = await api.createPaymentIntent(booking.id, token);
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) {
        setError(result.error.message);
      } else {
        setSucceeded(true);
        setTimeout(() => onPaid(), 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (succeeded) {
    return (
      <div className="py-6 text-center">
        <p className="text-2xl">✓</p>
        <p className="mt-2 text-sm font-medium text-moss-dark">Paiement autorisé — les fonds sont bloqués en séquestre.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="rounded-md border border-slate-200 px-3 py-3">
        <CardElement options={CARD_OPTIONS} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Carte de test : 4242 4242 4242 4242, une date future, n'importe quel CVC.
      </p>

      {error && <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-md border border-slate-200 py-3 text-sm font-medium text-ink hover:border-moss"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!stripe || busy}
          className="flex-1 rounded-md bg-moss py-3 text-sm font-semibold text-white hover:bg-moss-dark disabled:opacity-60"
        >
          {busy ? 'Traitement…' : `Payer ${booking.totalAmount} €`}
        </button>
      </div>
    </form>
  );
}

export default function PaymentModal({ booking, token, onClose, onPaid }) {
  const stripePromise = getStripe();

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold text-ink">Payer la mission</h2>
        <p className="mt-1 text-sm text-slate-500">{booking.mission?.title}</p>

        {!stripePromise ? (
          <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">
            Le paiement n'est pas configuré (clé Stripe manquante).
          </p>
        ) : (
          <div className="mt-4">
            <Elements stripe={stripePromise}>
              <CheckoutForm booking={booking} token={token} onClose={onClose} onPaid={onPaid} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}
