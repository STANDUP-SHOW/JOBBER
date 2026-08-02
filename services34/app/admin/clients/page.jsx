'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';

export default function AdminClientsPage() {
  const { token } = useAgencyAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    agencyApi.clients(search, token)
      .then(({ clients }) => setClients(clients))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, search]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Membres inscrits</h1>
      <p className="mt-1 text-sm text-slate-500">
        Les visiteurs de services34.fr qui ont créé un compte et publié au moins un besoin.
      </p>

      <label className="mt-6 block max-w-sm">
        <span className="text-xs font-medium text-slate-500">Rechercher</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom, email…"
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && clients.length === 0 && <p className="mt-6 text-slate-400">Aucun membre inscrit pour le moment.</p>}

      {!loading && clients.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand/10 font-display text-lg text-brand">
                  {c.avatarUrl ? <img src={c.avatarUrl} alt="" className="h-full w-full object-cover" /> : c.firstName?.[0]}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-display text-base font-semibold text-ink">{c.firstName} {c.lastName}</div>
                  <div className="truncate text-xs text-slate-500">{c.email}</div>
                </div>
              </Link>
              {c.address && <p className="mt-2 truncate text-xs text-slate-400">{c.address}</p>}

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-slate-50 p-2 text-center text-xs">
                <div><div className="font-semibold text-ink">{c.missionsPublished}</div><div className="text-slate-400">Publiées</div></div>
                <div><div className="font-semibold text-ink">{c.missionsCompleted}</div><div className="text-slate-400">Terminées</div></div>
                <div><div className="font-semibold text-ink">{c.totalSpent.toFixed(0)} €</div><div className="text-slate-400">Dépensé</div></div>
              </div>

              <div className="mt-3 flex gap-2">
                <Link href={`/admin/clients/${c.id}`} className="flex-1 rounded-md border border-slate-200 py-1.5 text-center text-xs font-medium text-ink hover:border-brand">
                  Voir le profil
                </Link>
                <a href={`mailto:${c.email}`} className="flex-1 rounded-md bg-brand py-1.5 text-center text-xs font-medium text-white hover:opacity-90">
                  Contacter
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
