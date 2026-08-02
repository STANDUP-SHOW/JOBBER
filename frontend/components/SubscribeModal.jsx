'use client';

import { useEffect, useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe } from '../lib/stripe';
import { api } from '../lib/api';

const CARD_OPTIONS = {
  style: {
    base: { fontSize: '15px', color: '#111114', '::placeholder': { color: '#8E8E93' } },
    invalid: { color: '#E63950' },
  },
};

function CardPay({ token, plan, onDone, onError, busy, setBusy }) {
  const stripe = useStripe();
  const elements = useElements();

  async function pay() {
    if (!stripe || !elements) return;
    setBusy(true);
    onError('');
    try {
      const { clientSecret } = await api.createSetupIntent(token);
      const result = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (result.error) {
        onError(result.error.message);
        setBusy(false);
        return;
      }
      const { subscription } = await api.subscribe(plan.value, 'card', token);
      onDone(subscription);
    } catch (err) {
      onError(err.message);
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="rounded-md border border-slate-200 px-3 py-3">
        <CardElement options={CARD_OPTIONS} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Carte de test : 4242 4242 4242 4242, une date future, n'importe quel CVC.
      </p>
      <button
        type="button"
        disabled={!stripe || busy}
        onClick={pay}
        className="mt-4 w-full rounded-md bg-moss py-3 text-sm font-semibold text-white hover:bg-moss-dark disabled:opacity-60"
      >
        {busy ? 'Traitement…' : `Payer ${plan.price.toFixed(2).replace('.', ',')} € et m'abonner`}
      </button>
    </div>
  );
}

// Internal payment window opened by "S'abonner" — pay either from the
// account balance (instant, no card needed) or by card (existing saved
// default card, or a fresh one entered inline via Stripe Elements).
export default function SubscribeModal({ plan, token, balance, savedCard, onClose, onSubscribed }) {
  const [payWith, setPayWith] = useState(balance >= plan.price ? 'balance' : 'card');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const stripePromise = getStripe();

  async function payWithBalance() {
    setBusy(true);
    setError('');
    try {
      const { subscription } = await api.subscribe(plan.value, 'balance', token);
      onSubscribed(subscription);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function payWithSavedCard() {
    setBusy(true);
    setError('');
    try {
      const { subscription } = await api.subscribe(plan.value, 'card', token);
      onSubscribed(subscription);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg font-semibold text-ink">S'abonner — {plan.name}</h2>
        <p className="mt-1 text-sm text-slate-500">{plan.price.toFixed(2).replace('.', ',')} € / mois</p>

        <div className="mt-4 flex rounded-md border border-slate-200 bg-white p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setPayWith('balance')}
            className={`flex-1 rounded px-3 py-1.5 ${payWith === 'balance' ? 'bg-moss text-white' : 'text-slate-500'}`}
          >
            Mon solde
          </button>
          <button
            type="button"
            onClick={() => setPayWith('card')}
            className={`flex-1 rounded px-3 py-1.5 ${payWith === 'card' ? 'bg-moss text-white' : 'text-slate-500'}`}
          >
            Carte bancaire
          </button>
        </div>

        {error && <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        {payWith === 'balance' && (
          <div className="mt-4">
            <p className="text-sm text-slate-600">Solde disponible : <strong>{balance.toFixed(2).replace('.', ',')} €</strong></p>
            {balance < plan.price ? (
              <p className="mt-2 rounded-md bg-ochre/10 px-3 py-2 text-sm text-ink">
                Solde insuffisant pour cette offre — utilisez la carte bancaire, ou rechargez votre solde.
              </p>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={payWithBalance}
                className="mt-4 w-full rounded-md bg-moss py-3 text-sm font-semibold text-white hover:bg-moss-dark disabled:opacity-60"
              >
                {busy ? 'Traitement…' : `Payer avec mon solde (${plan.price.toFixed(2).replace('.', ',')} €)`}
              </button>
            )}
          </div>
        )}

        {payWith === 'card' && (
          <div className="mt-4">
            {savedCard ? (
              <>
                <p className="text-sm text-slate-600">
                  Carte enregistrée : {savedCard.brand} •••• {savedCard.last4}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={payWithSavedCard}
                  className="mt-4 w-full rounded-md bg-moss py-3 text-sm font-semibold text-white hover:bg-moss-dark disabled:opacity-60"
                >
                  {busy ? 'Traitement…' : `Payer ${plan.price.toFixed(2).replace('.', ',')} € et m'abonner`}
                </button>
              </>
            ) : !stripePromise ? (
              <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">
                Le paiement par carte n'est pas configuré (clé Stripe manquante).
              </p>
            ) : (
              <Elements stripe={stripePromise}>
                <CardPay token={token} plan={plan} onDone={onSubscribed} onError={setError} busy={busy} setBusy={setBusy} />
              </Elements>
            )}
          </div>
        )}

        <button type="button" onClick={onClose} className="mt-4 w-full text-center text-sm text-slate-400 hover:text-ink">
          Annuler
        </button>
      </div>
    </div>
  );
}
