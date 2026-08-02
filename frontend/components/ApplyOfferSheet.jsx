'use client';

import { useState } from 'react';

// Mirrors EXTRA_FEE_TYPES in backend/src/routes/offers.routes.js — keep in sync.
const EXTRA_FEE_TYPES = {
  displacement: 'Frais de route - Déplacement',
  vehicle: 'Frais de mise à disposition du véhicule requis',
  fuel: 'Frais de carburant',
  consumables: 'Frais de consommables utilisés (produits, cartons)',
  equipment: 'Frais de matériel (location...)',
  wasteDisposal: 'Frais de déchetterie',
};

function emptySlot() {
  return { date: '', startTime: '09:00' };
}

export default function ApplyOfferSheet({ mission, defaultRate = 15, busy, error, onClose, onSubmit }) {
  const [step, setStep] = useState('confirm'); // confirm -> [propose] -> rate
  const [notFlexibleAlert, setNotFlexibleAlert] = useState(false);
  const [slots, setSlots] = useState([emptySlot()]);
  const [rate, setRate] = useState(defaultRate);
  const [wantsExtraFees, setWantsExtraFees] = useState(null); // null = not answered yet
  const [checked, setChecked] = useState({});
  const [amounts, setAmounts] = useState({});

  const hours = mission.estimatedHours;
  const extraFeesTotal = Object.keys(EXTRA_FEE_TYPES).reduce(
    (sum, key) => sum + (checked[key] ? Number(amounts[key]) || 0 : 0),
    0,
  );
  const total = (rate * hours + extraFeesTotal).toFixed(2).replace(/\.00$/, '');
  const missionDateLabel = new Date(mission.desiredDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const missionTimeLabel = new Date(mission.desiredDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  function adjust(delta) {
    setRate((r) => Math.max(5, r + delta));
  }

  function toggleFee(key) {
    setChecked((c) => ({ ...c, [key]: !c[key] }));
  }

  function confirmDate(confirmed) {
    if (confirmed) { setStep('rate'); return; }
    if (!mission.datesFlexible) { setNotFlexibleAlert(true); return; }
    setNotFlexibleAlert(false);
    setStep('propose');
  }

  function updateSlot(index, field, value) {
    setSlots((s) => s.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot)));
  }

  const validSlots = slots.filter((s) => s.date && s.startTime);

  function submit() {
    const extraFees = wantsExtraFees
      ? Object.entries(EXTRA_FEE_TYPES)
          .filter(([key]) => checked[key] && Number(amounts[key]) > 0)
          .map(([key]) => ({ key, amount: Number(amounts[key]) }))
      : [];
    onSubmit(rate, extraFees, step === 'rate' && validSlots.length ? validSlots : undefined);
  }

  if (step === 'confirm') {
    return (
      <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-ink/40" onClick={onClose}>
        <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 pb-8" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
          <h2 className="text-center font-display text-lg font-semibold text-ink">Confirmez-vous la date et l'heure ?</h2>
          <p className="mt-3 text-center text-base text-ink">
            Le client a fixé cette mission au <strong>{missionDateLabel}</strong> à <strong>{missionTimeLabel}</strong>.
          </p>
          {notFlexibleAlert && (
            <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-center text-sm text-clay">Les dates ne sont pas flexibles.</p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => confirmDate(true)}
              className="rounded-lg border-2 border-moss bg-moss py-3 font-display text-base font-bold uppercase tracking-wide text-white"
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => confirmDate(false)}
              className="rounded-lg border-2 border-slate-200 py-3 font-display text-base font-bold uppercase tracking-wide text-slate-500 hover:border-clay hover:text-clay"
            >
              Non
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'propose') {
    return (
      <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-ink/40" onClick={onClose}>
        <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 pb-8" onClick={(e) => e.stopPropagation()}>
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />
          <h2 className="text-center font-display text-lg font-semibold text-ink">Proposez vos disponibilités</h2>
          <p className="mt-2 text-center text-sm text-slate-500">Les dates étant flexibles, proposez jusqu'à 2 créneaux au client.</p>

          <div className="mt-5 space-y-4">
            {slots.map((slot, i) => (
              <div key={i} className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Date</span>
                  <input
                    type="date" value={slot.date}
                    onChange={(e) => updateSlot(i, 'date', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Heure</span>
                  <input
                    type="time" value={slot.startTime}
                    onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
                  />
                </label>
              </div>
            ))}
          </div>

          {slots.length < 2 && (
            <button
              type="button"
              onClick={() => setSlots((s) => [...s, emptySlot()])}
              className="mt-3 text-sm font-medium text-moss hover:underline"
            >
              + Ajouter une autre disponibilité
            </button>
          )}

          <button
            type="button"
            disabled={validSlots.length === 0}
            onClick={() => setStep('rate')}
            className="mt-6 w-full rounded-full bg-moss py-4 text-base font-semibold text-white hover:bg-moss-dark disabled:opacity-60"
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 pb-8"
        style={{ maxHeight: '90vh' }}
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

        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-medium text-ink">Voulez-vous introduire des options payantes à votre offre ?</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setWantsExtraFees(true)}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${wantsExtraFees === true ? 'bg-moss text-white' : 'border border-slate-200 text-ink hover:border-moss'}`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => { setWantsExtraFees(false); setChecked({}); }}
              className={`flex-1 rounded-md py-2 text-sm font-medium ${wantsExtraFees === false ? 'bg-moss text-white' : 'border border-slate-200 text-ink hover:border-moss'}`}
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
                      className="h-4 w-4 rounded border-slate-300 accent-moss"
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
          className="mt-5 w-full rounded-full bg-moss py-4 text-base font-semibold text-white hover:bg-moss-dark disabled:opacity-60"
        >
          {busy ? 'Envoi…' : "Confirmer l'offre"}
        </button>

        <p className="mt-3 text-center text-xs text-slate-400">
          {validSlots.length > 0 ? (
            <>En confirmant, vous proposez vos disponibilités au client — la mission sera fixée sur le créneau qu'il choisira.</>
          ) : (
            <>
              En confirmant, vous vous engagez à être disponible le{' '}
              <strong>{new Date(mission.desiredDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
