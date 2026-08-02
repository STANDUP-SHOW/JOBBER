'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import MissionInfoBadges from '../../../components/admin/MissionInfoBadges';
import DistanceBadge from '../../../components/admin/DistanceBadge';

export default function DemandesJobberPage() {
  const { token } = useAgencyAuth();
  const [missions, setMissions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    agencyApi.missionsPublished(token).then(({ missions }) => setMissions(missions)).catch((e) => setError(e.message));
  }, [token]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Demandes d'intervention Jobber</h1>
      <p className="mt-1 text-sm text-slate-500">
        Demandes publiées sur Jobber, en attente pendant 12h — Jobber sélectionne ensuite le meilleur candidat,
        recommandé, assuré, géolocalisable, badgé et professionnel.
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-6 space-y-3">
        {missions === null && <p className="text-sm text-slate-400">Chargement…</p>}
        {missions?.length === 0 && <p className="text-sm text-slate-400">Aucune demande publiée sur Jobber pour l'instant.</p>}
        {missions?.map((m) => (
          <div key={m.id} className="relative rounded-lg border border-slate-200 bg-white p-5">
            <DistanceBadge distanceKm={m.distanceKm} />
            <div className="flex items-center gap-2">
              <span className="text-xl">{m.category?.icon}</span>
              <Link href={`/admin/missions/${m.id}`} className="font-display text-base font-semibold text-ink hover:underline">
                {m.title}
              </Link>
              {m.corporateCode && (
                <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-mono font-semibold text-brand-dark">
                  {m.corporateCode}
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {new Date(m.desiredDate).toLocaleDateString('fr-FR')} · {m.estimatedHours} h · {m.offers?.length || 0} offre(s) en attente
            </div>
            <MissionInfoBadges mission={m} />
          </div>
        ))}
      </div>
    </div>
  );
}
