'use client';

import { useEffect, useState } from 'react';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import MissionCountdown from '../../../components/admin/MissionCountdown';
import PlanningPicker from '../../../components/admin/PlanningPicker';

export default function MissionsAgenceEnCoursPage() {
  const { token } = useAgencyAuth();
  const [missions, setMissions] = useState(null);
  const [plannings, setPlannings] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const { missions } = await agencyApi.missionsAgenceEnCours(token);
      setMissions(missions);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => {
    if (!token) return;
    refresh();
    agencyApi.plannings(token).then(({ plannings }) => setPlannings(plannings)).catch(() => {});
  }, [token]);

  async function assign(missionId, planningId) {
    setBusy(true);
    try { await agencyApi.assignPlanning(missionId, planningId, token); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Missions Agence en cours</h1>
      <p className="mt-1 text-sm text-slate-500">Missions que l'agence traite elle-même, sans jobber.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {missions === null && <p className="mt-4 text-sm text-slate-400">Chargement…</p>}
      {missions?.length === 0 && <p className="mt-4 text-sm text-slate-400">Aucune mission agence en cours.</p>}

      <div className="mt-6 space-y-3">
        {missions?.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <div className="font-medium text-ink">{m.category?.icon} {m.title}</div>
              <div className="text-sm text-slate-500">{m.client?.firstName} {m.client?.lastName} · {m.client?.phone}</div>
            </div>
            <div className="flex items-center gap-3">
              <MissionCountdown desiredDate={m.desiredDate} />
              <PlanningPicker mission={m} plannings={plannings} onAssign={assign} busy={busy} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
