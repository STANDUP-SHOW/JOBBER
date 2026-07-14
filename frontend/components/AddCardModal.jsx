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

function AddCardForm({ token, onClose, onAdded }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setError('');
    try {
      const { clientSecret } = await api.createSetupIntent(token);
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) {
        setError(result.error.message);
      } else {
        onAdded();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
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
          {busy ? 'Enregistrement…' : 'Ajouter la carte'}
        </button>
      </div>
    </form>
  );
}

export default function AddCardModal({ token, onClose, onAdded }) {
  const stripePromise = getStripe();

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold text-ink">Ajouter une carte</h2>

        {!stripePromise ? (
          <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">
            Le paiement n'est pas configuré (clé Stripe manquante).
          </p>
        ) : (
          <div className="mt-4">
            <Elements stripe={stripePromise}>
              <AddCardForm token={token} onClose={onClose} onAdded={onAdded} />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
}
