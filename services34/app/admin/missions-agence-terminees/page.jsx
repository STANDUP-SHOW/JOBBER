'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import MissionInfoBadges from '../../../components/admin/MissionInfoBadges';
import DistanceBadge from '../../../components/admin/DistanceBadge';

export default function MissionsAgenceTermineesPage() {
  const { token } = useAgencyAuth();
  const [missions, setMissions] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function refresh() {
    try {
      const { missions } = await agencyApi.missionsAgenceTerminees(token);
      setMissions(missions);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { if (token) refresh(); }, [token]);

  async function generateInvoice(missionId) {
    setBusyId(missionId);
    try {
      await agencyApi.generateMissionInvoice(missionId, token);
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusyId(null); }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Missions Agence terminées</h1>
      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {missions === null && <p className="mt-4 text-sm text-slate-400">Chargement…</p>}
      {missions?.length === 0 && <p className="mt-4 text-sm text-slate-400">Aucune mission agence terminée pour l'instant.</p>}

      <div className="mt-6 space-y-3">
        {missions?.map((m) => (
          <div key={m.id} className="relative flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
            <DistanceBadge distanceKm={m.distanceKm} />
            <div>
              <Link href={`/admin/missions/${m.id}`} className="font-medium text-ink hover:underline">{m.title}</Link>{' '}
              {m.corporateCode && <span className="font-mono text-xs text-slate-400">({m.corporateCode})</span>}
              <div className="text-sm text-slate-500">{m.client?.firstName} {m.client?.lastName} · {m.booking?.totalAmount} €</div>
              <MissionInfoBadges mission={m} />
            </div>
            <button
              type="button"
              disabled={busyId === m.id}
              onClick={() => generateInvoice(m.id)}
              className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-60"
            >
              Générer la facture
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
