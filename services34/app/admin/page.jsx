'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../lib/agency-auth-context';
import { agencyApi } from '../../lib/agencyApi';
import MissionInfoBadges from '../../components/admin/MissionInfoBadges';
import TraiterEnAgenceSheet from '../../components/admin/TraiterEnAgenceSheet';

export default function DemandesRecuesPage() {
  const { token } = useAgencyAuth();
  const [missions, setMissions] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [view, setView] = useState('liste');
  const [sheetFor, setSheetFor] = useState(null);
  const [sheetError, setSheetError] = useState('');

  async function refresh() {
    try {
      const { missions } = await agencyApi.missionsReceived(token);
      setMissions(missions);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { if (token) refresh(); }, [token]);

  async function publish(id) {
    setBusyId(id);
    try {
      await agencyApi.publishToJobber(id, token);
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusyId(null); }
  }

  async function missionAgence(hourlyRate, extraFees) {
    setBusyId(sheetFor); setSheetError('');
    try {
      await agencyApi.missionAgence(sheetFor, { hourlyRate, extraFees }, token);
      setSheetFor(null);
      await refresh();
    } catch (err) { setSheetError(err.message); } finally { setBusyId(null); }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Demandes d'interventions reçues</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView('liste')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === 'liste' ? 'bg-brand text-white' : 'border border-slate-200 text-ink'}`}
          >
            Vue liste
          </button>
          <button
            type="button"
            onClick={() => setView('carte')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === 'carte' ? 'bg-brand text-white' : 'border border-slate-200 text-ink'}`}
          >
            Vue carte
          </button>
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Demandes soumises via services34.fr, en attente de votre décision : publier sur Jobber ou traiter en direct via l'agence.
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {view === 'carte' ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
          Vue carte à venir — nécessite la carte des missions déjà utilisée sur Jobber.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {missions === null && <p className="text-sm text-slate-400">Chargement…</p>}
          {missions?.length === 0 && <p className="text-sm text-slate-400">Aucune demande en attente.</p>}
          {missions?.map((m) => (
            <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
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
                    {m.category?.name}{m.service ? ` · ${m.service.name}` : ''}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {m.client?.firstName} {m.client?.lastName} · {m.client?.phone || m.client?.email} ·{' '}
                    {new Date(m.desiredDate).toLocaleDateString('fr-FR')} · {m.estimatedHours} h
                  </div>
                  {m.description && <p className="mt-2 text-sm text-slate-600">{m.description}</p>}
                  <MissionInfoBadges mission={m} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => publish(m.id)}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  Publier sur Jobber
                </button>
                <span className="text-xs text-slate-400">ou</span>
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => setSheetFor(m.id)}
                  className="rounded-md border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-60"
                >
                  Mission Agence
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sheetFor && (
        <TraiterEnAgenceSheet
          mission={missions.find((m) => m.id === sheetFor)}
          busy={busyId === sheetFor}
          error={sheetError}
          onClose={() => { setSheetFor(null); setSheetError(''); }}
          onSubmit={missionAgence}
        />
      )}
    </div>
  );
}
