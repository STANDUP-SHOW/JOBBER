'use client';

import { useState } from 'react';

const JOBBER_FEE = 10; // frais de mise en relation par mission, gratuit pour le jobber
const VAT = 1.2;

const SECTORS = [
  { label: 'Logistique', coefficient: 1.7 },
  { label: 'BTP', coefficient: 1.85 },
  { label: 'Industrie', coefficient: 1.9 },
  { label: 'Tertiaire', coefficient: 2.05 },
  { label: 'Profil rare', coefficient: 2.3 },
];

export default function InterimComparator() {
  const [rate, setRate] = useState(15);
  const [hours, setHours] = useState(35);
  const [sector, setSector] = useState(SECTORS[2]);

  const interimHT = rate * hours * sector.coefficient;
  const interimTTC = interimHT * VAT;
  const jobberCost = rate * hours + JOBBER_FEE;
  const savings = interimTTC - jobberCost;
  const savingsPct = interimTTC > 0 ? (savings / interimTTC) * 100 : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">Tarif horaire souhaité</span>
            <span className="rounded-full bg-moss px-3 py-1 text-xs font-semibold text-white">{rate} €/h</span>
          </div>
          <input
            type="range" min={10} max={40} value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="mt-2 w-full accent-moss"
          />
          <div className="flex justify-between text-xs text-slate-400"><span>10 €</span><span>40 €</span></div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">Durée de la mission</span>
            <span className="rounded-full bg-moss px-3 py-1 text-xs font-semibold text-white">{hours} h</span>
          </div>
          <input
            type="range" min={1} max={160} value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="mt-2 w-full accent-moss"
          />
          <div className="flex justify-between text-xs text-slate-400"><span>1 h</span><span>160 h</span></div>
        </div>

        <div>
          <span className="text-sm font-medium text-ink">Secteur (coefficient de facturation agence)</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {SECTORS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => setSector(s)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  s.label === sector.label
                    ? 'border-moss bg-moss text-white'
                    : 'border-slate-200 text-slate-600 hover:border-moss'
                }`}
              >
                {s.label} · {s.coefficient.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2 rounded-lg bg-paper p-4 text-sm">
        <Row label={`Coût intérim TTC (coeff. ${sector.coefficient.toFixed(2)})`} value={`${interimTTC.toFixed(2)} €`} />
        <Row label="Coût avec Jobber+ (frais de mission inclus)" value={`${jobberCost.toFixed(2)} €`} />
        <div className="border-t border-slate-200 pt-2">
          <Row label="Vous économisez" value={`${savings.toFixed(2)} € (${savingsPct.toFixed(0)} %)`} bold />
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-md bg-moss-light px-3 py-2.5 text-sm text-moss-dark">
        <span>✓</span>
        <span>
          Avec Jobber+, vous ne payez que le tarif convenu avec votre jobber, plus {JOBBER_FEE} € de frais de
          mission — aucune charge, aucun coefficient d'agence.
        </span>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Estimation à titre indicatif. Le coefficient de facturation d'une agence d'intérim n'est pas réglementé et
        varie librement selon l'agence, le secteur, le volume et la durée de la mission (1,65 à 2,40 en moyenne) ;
        il couvre le salaire brut, l'indemnité de fin de mission, les congés payés, les charges patronales et la
        marge de l'agence.
      </p>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? 'font-semibold text-ink' : 'text-slate-500'}>{label}</span>
      <span className={bold ? 'font-semibold text-ink' : 'text-ink'}>{value}</span>
    </div>
  );
}
