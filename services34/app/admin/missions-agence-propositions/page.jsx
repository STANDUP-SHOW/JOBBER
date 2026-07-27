'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import MissionInfoBadges from '../../../components/admin/MissionInfoBadges';

export default function MissionsAgencePropositionsPage() {
  const { token } = useAgencyAuth();
  const [missions, setMissions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    agencyApi
      .missionsPropositionsEnAttente(token)
      .then(({ missions }) => setMissions(missions))
      .catch((err) => setError(err.message));
  }, [token]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Propositions en attente</h1>
      <p className="mt-1 text-sm text-slate-500">
        Devis envoyés au client pour une mission agence, en attente de son acceptation depuis son compte services34.fr.
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {missions === null && <p className="mt-4 text-sm text-slate-400">Chargement…</p>}
      {missions?.length === 0 && <p className="mt-4 text-sm text-slate-400">Aucune proposition en attente.</p>}

      <div className="mt-6 space-y-3">
        {missions?.map((m) => {
          const offer = m.offers?.[0];
          const hours = offer?.hours ?? m.estimatedHours;
          const extraFeesTotal = (offer?.extraFees || []).reduce((sum, f) => sum + f.amount, 0);
          const total = offer ? (offer.hourlyRate * hours + extraFeesTotal).toFixed(2).replace(/\.00$/, '') : null;
          return (
            <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-ink">
                    {m.category?.icon} <Link href={`/admin/missions/${m.id}`} className="hover:underline">{m.title}</Link>
                  </div>
                  <div className="text-sm text-slate-500">{m.client?.firstName} {m.client?.lastName} · {m.client?.phone}</div>
                  <MissionInfoBadges mission={m} />
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-accent-dark">En attente du client</div>
                  {offer && <div className="mt-1 text-lg font-semibold text-ink">{total} €</div>}
                  {offer && <div className="text-xs text-slate-400">{offer.hourlyRate} €/h · {hours} h</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
