'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import { useBrand } from '../../../lib/brand-context';

const MISSION_STATUS_LABELS = {
  OPEN: 'Ouverte',
  ASSIGNED: 'Attribuée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export default function AdminClientDetailPage() {
  const { id } = useParams();
  const { token } = useAgencyAuth();
  const brand = useBrand();
  const [client, setClient] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    agencyApi.client(id, token).then(({ client }) => setClient(client)).catch((e) => setError(e.message));
  }, [token, id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!client) return <p className="text-slate-400">Chargement…</p>;

  return (
    <div className="max-w-2xl">
      <Link href="/clients" className="text-sm text-slate-400 hover:text-brand">← Membres inscrits</Link>

      <div className="mt-3 flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 font-display text-2xl text-brand">
          {client.avatarUrl ? <img src={client.avatarUrl} alt="" className="h-full w-full object-cover" /> : client.firstName?.[0]}
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{client.firstName} {client.lastName}</h1>
          <p className="text-sm text-slate-500">{client.email} {client.phone && `· ${client.phone}`}</p>
        </div>
        <a href={`mailto:${client.email}`} className="ml-auto shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Contacter
        </a>
      </div>

      <div className="mt-4 space-y-1 text-sm text-slate-500">
        {client.address && <p>{client.address}</p>}
        <p>Inscrit le {new Date(client.createdAt).toLocaleDateString('fr-FR')}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div className="font-display text-2xl font-bold text-ink">{client.missionsPublished}</div>
          <div className="text-xs text-slate-400">Missions publiées</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div className="font-display text-2xl font-bold text-ink">{client.missionsCompleted}</div>
          <div className="text-xs text-slate-400">Terminées</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div className="font-display text-2xl font-bold text-ink">{client.missionsCancelled}</div>
          <div className="text-xs text-slate-400">Annulées</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div className="font-display text-2xl font-bold text-ink">{client.reviewsGiven}</div>
          <div className="text-xs text-slate-400">Avis laissés</div>
        </div>
        <div className="rounded-lg border border-brand/30 bg-brand/5 p-4 text-center sm:col-span-2">
          <div className="font-display text-2xl font-bold text-brand">{client.totalSpent.toFixed(2)} €</div>
          <div className="text-xs text-brand">Montant dépensé via {brand.name}</div>
        </div>
      </div>

      {client.missions?.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-medium text-ink">Missions publiées</h2>
          <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {client.missions.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-ink">{m.title}</span>
                <span className="text-xs text-slate-400">{MISSION_STATUS_LABELS[m.status] || m.status} · {new Date(m.createdAt).toLocaleDateString('fr-FR')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
