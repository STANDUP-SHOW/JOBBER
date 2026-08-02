'use client';

import { useState } from 'react';

const MARGIN_RATE = 0.3;
const STEP = 5;

function jobberTotal(offer) {
  const hours = offer.hours ?? offer.mission.estimatedHours;
  const extraFeesTotal = (offer.extraFees || []).reduce((sum, f) => sum + f.amount, 0);
  return offer.hourlyRate * hours + extraFeesTotal;
}

// "Devis client" — opened once a jobber offer is auto-SELECTED as the best
// of the batch. Defaults the client-facing price to the jobber's total +
// 30% agency margin, adjustable with the same +/- stepper used across the
// admin (see TraiterEnAgenceSheet).
export default function DevisModal({ offer, busy, error, onClose, onSubmit }) {
  const base = jobberTotal(offer);
  const [amount, setAmount] = useState(Math.round((base * (1 + MARGIN_RATE)) / STEP) * STEP);

  function adjust(delta) {
    setAmount((a) => Math.max(STEP, a + delta));
  }

  const margin = Math.round((amount - base) * 100) / 100;

  return (
    <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 pb-8"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

        <h2 className="text-center font-display text-lg font-semibold text-ink">Devis client</h2>
        <p className="mt-1 text-center text-sm text-slate-500">Combien souhaitez-vous facturer cette prestation ?</p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => adjust(-STEP)}
            aria-label="Diminuer le montant"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-white hover:bg-brand-dark"
          >
            −
          </button>
          <span className="min-w-[9rem] text-center font-display text-4xl font-bold text-ink">{amount} €</span>
          <button
            type="button"
            onClick={() => adjust(STEP)}
            aria-label="Augmenter le montant"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-white hover:bg-brand-dark"
          >
            +
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="text-xs text-slate-500">Devis jobber</div>
            <div className="mt-1 text-lg font-semibold text-ink">{base.toFixed(2)} €</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="text-xs text-slate-500">Votre marge</div>
            <div className="mt-1 text-lg font-semibold text-ink">{margin.toFixed(2)} €</div>
          </div>
        </div>

        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={busy}
          onClick={() => onSubmit(amount)}
          className="mt-5 w-full rounded-full bg-brand py-4 text-base font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? 'Envoi…' : 'Envoyer le devis'}
        </button>
      </div>
    </div>
  );
}
