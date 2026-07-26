'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import { api } from '../../../lib/api';

export default function EmployesActifsPage() {
  const { token } = useAgencyAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!token) return;
    agencyApi.employees(token).then(({ employees }) => setEmployees(employees)).catch((e) => setError(e.message));
  }, [token]);

  const active = employees?.filter((e) => e.activeMissions?.length > 0);

  async function openMessagerie(jobberId, missionId) {
    setBusyId(jobberId);
    try {
      const { conversation } = await api.startConversation({ missionId, providerId: jobberId }, token);
      router.push(`/admin/messages/${conversation.id}`);
    } catch (err) { setError(err.message); } finally { setBusyId(null); }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Mes employés ON</h1>
      <p className="mt-1 text-sm text-slate-500">
        Employés actuellement en mission. Voir <Link href="/admin/employes" className="font-medium text-brand hover:underline">Mes employés OFF</Link> pour tout votre vivier.
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {employees === null && <p className="mt-6 text-sm text-slate-400">Chargement…</p>}
      {active?.length === 0 && <p className="mt-6 text-sm text-slate-400">Aucun employé en mission pour l'instant.</p>}

      <div className="mt-6 space-y-3">
        {active?.map(({ jobber, activeMissions }) => (
          <div key={jobber.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="font-medium text-ink">{jobber.firstName} {jobber.lastName?.[0]}.</div>
            <div className="mt-1 space-y-1">
              {activeMissions.map((m) => (
                <div key={m.id} className="text-sm text-slate-500">
                  {m.category?.icon} {m.title} · {m.offerStatus === 'PENDING' ? 'en attente de réponse' : 'en cours'}
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busyId === jobber.id}
                onClick={() => openMessagerie(jobber.id, activeMissions[0].id)}
                className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
              >
                Messagerie interne
              </button>
              {jobber.email && (
                <a href={`mailto:${jobber.email}`} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-ink hover:border-slate-300">
                  Email
                </a>
              )}
              {jobber.phone && (
                <a href={`tel:${jobber.phone}`} className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-ink hover:border-slate-300">
                  Téléphone
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
