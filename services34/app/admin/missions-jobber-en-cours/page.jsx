'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import MissionCountdown from '../../../components/admin/MissionCountdown';
import PlanningPicker from '../../../components/admin/PlanningPicker';
import MissionInfoBadges from '../../../components/admin/MissionInfoBadges';
import DistanceBadge from '../../../components/admin/DistanceBadge';

export default function MissionsJobberEnCoursPage() {
  const { token } = useAgencyAuth();
  const [missions, setMissions] = useState(null);
  const [plannings, setPlannings] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const { missions } = await agencyApi.missionsJobberEnCours(token);
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

  async function validerFinMission(bookingId) {
    setBusy(true);
    try { await agencyApi.validerFinMission(bookingId, token); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

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
                <div key={m.id} className="relative flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
                  <DistanceBadge distanceKm={m.distanceKm} />
                  <div>
                    <Link href={`/admin/missions/${m.id}`} className="font-medium text-ink hover:underline">{m.title}</Link>
                    <div className="text-sm text-slate-500">
                      {m.booking?.provider?.firstName} {m.booking?.provider?.lastName?.[0]}. · {new Date(m.desiredDate).toLocaleString('fr-FR')}
                    </div>
                    <MissionInfoBadges mission={m} />
                    {m.booking?.status === 'AWAITING_VALIDATION' && (
                      <p className="mt-1 text-sm font-medium text-clay">Le jobber a terminé — en attente de votre validation</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {m.booking?.status === 'AWAITING_VALIDATION' ? (
                      <button
                        type="button"
                        onClick={() => validerFinMission(m.booking.id)}
                        disabled={busy}
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Valider et payer le jobber
                      </button>
                    ) : (
                      <>
                        <MissionCountdown desiredDate={m.desiredDate} />
                        <PlanningPicker mission={m} plannings={plannings} onAssign={assign} busy={busy} />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
