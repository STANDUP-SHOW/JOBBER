'use client';

import { useState } from 'react';

// Mirrors EXTRA_FEE_TYPES in backend/src/routes/agency-admin.routes.js — keep in sync.
const EXTRA_FEE_TYPES = {
  displacement: 'Frais de route - Déplacement',
  vehicle: 'Frais de mise à disposition du véhicule requis',
  fuel: 'Frais de carburant',
  consumables: 'Frais de consommables utilisés (produits, cartons)',
  equipment: 'Frais de matériel (location...)',
  wasteDisposal: 'Frais de déchetterie',
};

export default function TraiterEnAgenceSheet({ mission, busy, error, onClose, onSubmit }) {
  const [rate, setRate] = useState(15);
  const [wantsExtraFees, setWantsExtraFees] = useState(null);
  const [checked, setChecked] = useState({});
  const [amounts, setAmounts] = useState({});

  const hours = mission.estimatedHours;
  const extraFeesTotal = Object.keys(EXTRA_FEE_TYPES).reduce(
    (sum, key) => sum + (checked[key] ? Number(amounts[key]) || 0 : 0),
    0,
  );
  const total = (rate * hours + extraFeesTotal).toFixed(2).replace(/\.00$/, '');

  function adjust(delta) {
    setRate((r) => Math.max(5, r + delta));
  }

  function toggleFee(key) {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  }

  function submit() {
    const extraFees = wantsExtraFees
      ? Object.entries(EXTRA_FEE_TYPES)
          .filter(([key]) => checked[key] && Number(amounts[key]) > 0)
          .map(([key]) => ({ key, amount: Number(amounts[key]) }))
      : [];
    onSubmit(rate, extraFees);
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 pb-8"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

        <h2 className="text-center font-display text-lg font-semibold text-ink">Traiter en agence — tarif horaire</h2>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => adjust(-1)}
            aria-label="Diminuer le tarif"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-white hover:bg-brand-dark"
          >
            −
          </button>
          <span className="min-w-[9rem] text-center font-display text-4xl font-bold text-ink">{rate} €/h</span>
          <button
            type="button"
            onClick={() => adjust(1)}
            aria-label="Augmenter le tarif"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-white hover:bg-brand-dark"
          >
            +
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="text-xs text-slate-500">Durée estimée</div>
            <div className="mt-1 text-lg font-semibold text-ink">{hours} h</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <div className="text-xs text-slate-500">Total facturé au client</div>
            <div className="mt-1 text-lg font-semibold text-ink">{total} €</div>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-medium text-ink">Avez-vous des options payantes à ajouter ?</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setWantsExtraFees(true)}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${wantsExtraFees === true ? 'bg-brand text-white' : 'border border-slate-200 text-ink hover:border-brand'}`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => { setWantsExtraFees(false); setChecked({}); }}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${wantsExtraFees === false ? 'bg-brand text-white' : 'border border-slate-200 text-ink hover:border-brand'}`}
            >
              Non
            </button>
          </div>

          {wantsExtraFees && (
            <div className="mt-4 space-y-2">
              {Object.entries(EXTRA_FEE_TYPES).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="flex flex-1 items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={!!checked[key]}
                      onChange={() => toggleFee(key)}
                      className="h-4 w-4 rounded border-slate-300 accent-brand"
                    />
                    {label}
                  </label>
                  {checked[key] && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        step="0.5"
                        value={amounts[key] || ''}
                        onChange={(e) => setAmounts((a) => ({ ...a, [key]: e.target.value }))}
                        placeholder="0"
                        className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm"
                      />
                      <span className="text-sm text-slate-500">€</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button
          type="button"
          disabled={busy}
          onClick={submit}
          className="mt-5 w-full rounded-full bg-brand py-4 text-base font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? 'Envoi…' : 'Confirmer — traiter en agence'}
        </button>
      </div>
    </div>
  );
}
