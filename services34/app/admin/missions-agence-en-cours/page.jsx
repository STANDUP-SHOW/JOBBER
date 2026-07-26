'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import MissionCountdown from '../../../components/admin/MissionCountdown';
import PlanningPicker from '../../../components/admin/PlanningPicker';
import EmbaucherEmployePicker from '../../../components/admin/EmbaucherEmployePicker';
import MissionInfoBadges from '../../../components/admin/MissionInfoBadges';

export default function MissionsAgenceEnCoursPage() {
  const { token, agency } = useAgencyAuth();
  const [missions, setMissions] = useState(null);
  const [plannings, setPlannings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateSort, setDateSort] = useState('asc');
  const [planifieeFilter, setPlanifieeFilter] = useState('');
  const [embaucheFilter, setEmbaucheFilter] = useState('');

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
    agencyApi.employees(token).then(({ employees }) => setEmployees(employees)).catch(() => {});
  }, [token]);

  async function assign(missionId, planningId) {
    setBusy(true);
    try { await agencyApi.assignPlanning(missionId, planningId, token); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function embaucher(missionId, jobberId) {
    setBusy(true);
    try { await agencyApi.embaucherEmploye(missionId, jobberId, token); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  function isEmbauchee(m) {
    return m.booking?.providerId && m.booking.providerId !== agency?.id;
  }

  const categories = Array.from(
    new Map((missions || []).map((m) => [m.category?.id, m.category]).filter(([id]) => id)).values()
  );

  const visible = (missions || [])
    .filter((m) => !categoryFilter || m.category?.id === categoryFilter)
    .filter((m) => !planifieeFilter || (planifieeFilter === 'oui' ? !!m.planningId : !m.planningId))
    .filter((m) => !embaucheFilter || (embaucheFilter === 'oui' ? isEmbauchee(m) : !isEmbauchee(m)))
    .sort((a, b) => {
      const diff = new Date(a.desiredDate) - new Date(b.desiredDate);
      return dateSort === 'asc' ? diff : -diff;
    });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Missions Agence en cours</h1>
      <p className="mt-1 text-sm text-slate-500">Missions que l'agence traite elle-même ou via un employé, sans passer par Jobber.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
        <select value={dateSort} onChange={(e) => setDateSort(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
          <option value="asc">Date croissante</option>
          <option value="desc">Date décroissante</option>
        </select>
        <select value={planifieeFilter} onChange={(e) => setPlanifieeFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
          <option value="">Planifiée : toutes</option>
          <option value="oui">Planifiée : oui</option>
          <option value="non">Planifiée : non</option>
        </select>
        <select value={embaucheFilter} onChange={(e) => setEmbaucheFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
          <option value="">Embauche effectuée : toutes</option>
          <option value="oui">Embauche effectuée : oui</option>
          <option value="non">Embauche effectuée : non</option>
        </select>
      </div>

      {missions === null && <p className="mt-4 text-sm text-slate-400">Chargement…</p>}
      {missions?.length === 0 && <p className="mt-4 text-sm text-slate-400">Aucune mission agence en cours.</p>}
      {missions?.length > 0 && visible.length === 0 && <p className="mt-4 text-sm text-slate-400">Aucune mission ne correspond à ces filtres.</p>}

      <div className="mt-6 space-y-3">
        {visible.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <div className="font-medium text-ink">
                {m.category?.icon} <Link href={`/admin/missions/${m.id}`} className="hover:underline">{m.title}</Link>
              </div>
              <div className="text-sm text-slate-500">{m.client?.firstName} {m.client?.lastName} · {m.client?.phone}</div>
              {isEmbauchee(m) && (
                <div className="mt-1 text-xs font-semibold text-brand-dark">
                  Employé embauché : {m.booking.provider?.firstName} {m.booking.provider?.lastName?.[0]}.
                </div>
              )}
              <MissionInfoBadges mission={m} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <MissionCountdown desiredDate={m.desiredDate} />
              <EmbaucherEmployePicker mission={m} employees={employees} onAssign={embaucher} busy={busy} />
              <PlanningPicker mission={m} plannings={plannings} onAssign={assign} busy={busy} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
