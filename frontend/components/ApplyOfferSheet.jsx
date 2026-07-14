'use client';

import { useState } from 'react';

export default function ApplyOfferSheet({ mission, defaultRate = 15, busy, error, onClose, onSubmit }) {
  const [rate, setRate] = useState(defaultRate);

  const hours = mission.estimatedHours;
  const total = (rate * hours).toFixed(2).replace(/\.00$/, '');

  function adjust(delta) {
    setRate((r) => Math.max(5, r + delta));
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

        <h2 className="text-center font-display text-lg font-semibold text-ink">Ajuster votre taux horaire</h2>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => adjust(-1)}
            aria-label="Diminuer le tarif"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-moss text-2xl font-semibold text-white hover:bg-moss-dark"
          >
            −
          </button>
          <span className="min-w-[9rem] text-center font-display text-4xl font-bold text-ink">{rate} €/h</span>
          <button
            type="button"
            onClick={() => adjust(1)}
            aria-label="Augmenter le tarif"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-moss text-2xl font-semibold text-white hover:bg-moss-dark"
          >
            +
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="text-xs text-slate-500">Durée initiale</div>
            <div className="mt-1 text-lg font-semibold text-ink">{hours} h</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="text-xs text-slate-500">Rémunération totale</div>
            <div className="mt-1 text-lg font-semibold text-ink">{total} €</div>
          </div>
        </div>

        {error && <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button
          type="button"
          disabled={busy}
          onClick={() => onSubmit(rate)}
          className="mt-5 w-full rounded-full bg-moss py-4 text-base font-semibold text-white hover:bg-moss-dark disabled:opacity-60"
        >
          {busy ? 'Envoi…' : "Confirmer l'offre"}
        </button>

        <p className="mt-3 text-center text-xs text-slate-400">
          En confirmant, vous vous engagez à être disponible le{' '}
          <strong>{new Date(mission.desiredDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
        </p>
      </div>
    </div>
  );
}
