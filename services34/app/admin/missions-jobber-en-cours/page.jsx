'use client';

import { useEffect, useState } from 'react';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import MissionCountdown from '../../../components/admin/MissionCountdown';

export default function MissionsJobberEnCoursPage() {
  const { token } = useAgencyAuth();
  const [missions, setMissions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    agencyApi.missionsJobberEnCours(token).then(({ missions }) => setMissions(missions)).catch((e) => setError(e.message));
  }, [token]);

  const byCategory = missions?.reduce((acc, m) => {
    const key = m.category?.name || 'Autre';
    (acc[key] = acc[key] || []).push(m);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Missions Jobber en cours</h1>
      <p className="mt-1 text-sm text-slate-500">Planning des missions confiées à un jobber, groupées par catégorie.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {missions === null && <p className="mt-4 text-sm text-slate-400">Chargement…</p>}
      {missions?.length === 0 && <p className="mt-4 text-sm text-slate-400">Aucune mission en cours.</p>}

      <div className="mt-6 space-y-6">
        {byCategory && Object.entries(byCategory).map(([category, list]) => (
          <div key={category}>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">{category}</h2>
            <div className="mt-2 space-y-3">
              {list.map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                  <div>
                    <div className="font-medium text-ink">{m.title}</div>
                    <div className="text-sm text-slate-500">
                      {m.booking?.provider?.firstName} {m.booking?.provider?.lastName?.[0]}. · {new Date(m.desiredDate).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  <MissionCountdown desiredDate={m.desiredDate} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
