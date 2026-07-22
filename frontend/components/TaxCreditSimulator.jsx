'use client';

import { useState } from 'react';

const CREDIT_RATE = 0.5; // Crédit d'impôt services à la personne — 50 %, art. 199 sexdecies CGI

export default function TaxCreditSimulator() {
  const [hours, setHours] = useState(2);
  const [rate, setRate] = useState(12);

  const gross = hours * rate;
  const credit = gross * CREDIT_RATE;
  const net = gross - credit;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">Durée de la prestation</span>
            <span className="rounded-full bg-moss px-3 py-1 text-xs font-semibold text-white">{hours} h</span>
          </div>
          <input
            type="range" min={1} max={35} value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="mt-2 w-full accent-moss"
          />
          <div className="flex justify-between text-xs text-slate-400"><span>1 h</span><span>35 h</span></div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">Tarif horaire net du prestataire</span>
            <span className="rounded-full bg-moss px-3 py-1 text-xs font-semibold text-white">{rate} €</span>
          </div>
          <input
            type="range" min={10} max={50} value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-2 w-full accent-moss"
          />
          <div className="flex justify-between text-xs text-slate-400"><span>10 €</span><span>50 €</span></div>
        </div>
      </div>

      <div className="mt-6 space-y-2 rounded-lg bg-paper p-4 text-sm">
        <Row label="Prestation avant crédit d'impôt" value={`${gross.toFixed(2)} €`} />
        <Row label="Crédit d'impôt (50 %)" value={`-${credit.toFixed(2)} €`} highlight />
        <div className="border-t border-slate-200 pt-2">
          <Row label="Prestation après crédit d'impôt" value={`${net.toFixed(2)} €`} bold />
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-md bg-moss-light px-3 py-2.5 text-sm text-moss-dark">
        <span>✓</span>
        <span>Vous économisez {credit.toFixed(2)} € avec le crédit d'impôt.</span>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Estimation à titre indicatif, hors plafond annuel (12 000 € par foyer, majorations possibles) et hors
        situation fiscale personnelle. Ceci ne constitue pas un conseil fiscal.
      </p>
    </div>
  );
}

function Row({ label, value, bold, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? 'font-semibold text-ink' : 'text-slate-500'}>{label}</span>
      <span className={bold ? 'font-semibold text-ink' : highlight ? 'font-medium text-moss-dark' : 'text-ink'}>{value}</span>
    </div>
  );
}
