'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

const KIND_FILTERS = [
  ['', 'Tous'],
  ['MANAGER', 'Managers'],
  ['JOBBER', 'Jobbers'],
  ['BOTH', 'Les deux'],
  ['ENTREPRISE', 'Entreprises'],
  ['CORPORATE', 'Corporates'],
];

function memberName(m) {
  return m.accountKind === 'COMPANY' ? m.companyName : `${m.firstName || ''} ${m.lastName || ''}`.trim();
}

export default function AdminMembersPage() {
  const { token } = useAuth();
  const [members, setMembers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true); setError('');
    const params = { page, ...(search ? { search } : {}), ...(kind ? { kind } : {}) };
    api.adminMembers(params, token)
      .then(({ members, total }) => { setMembers(members); setTotal(total); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, page, search, kind]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="block max-w-xs grow">
          <span className="text-xs font-medium text-slate-500">Rechercher</span>
          <input
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            placeholder="Nom, email, entreprise…"
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
          />
        </label>
        <div className="flex flex-wrap rounded-md border border-slate-200 bg-white p-1 text-sm font-medium">
          {KIND_FILTERS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => { setPage(1); setKind(value); }}
              className={`rounded px-3 py-1.5 ${kind === value ? 'bg-moss text-paper' : 'text-slate-500 hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && members.length === 0 && <p className="mt-6 text-slate-400">Aucun membre ne correspond à ces filtres.</p>}

      {!loading && members.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => (
            <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <Link href={`/admin/members/${m.id}`} className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-moss-light font-display text-lg text-moss-dark">
                  {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" /> : memberName(m)[0]}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-display text-base font-semibold text-ink">{memberName(m)}</div>
                  <div className="truncate text-xs text-slate-500">{m.email}</div>
                </div>
              </Link>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                  {m.accountKind === 'COMPANY' ? (m.companyType === 'CORPORATE' ? 'Corporate' : 'Entreprise') : (m.isProfessional ? 'Pro' : 'Particulier')}
                </span>
                {m.providerProfile?.ratingCount > 0 && (
                  <span className="rounded-full bg-ochre-light px-2 py-0.5 text-[11px] font-medium text-ochre-dark">
                    ★ {m.providerProfile.ratingAverage.toFixed(1)} ({m.providerProfile.ratingCount})
                  </span>
                )}
              </div>

              {m.address && <p className="mt-2 truncate text-xs text-slate-400">{m.address}</p>}
              {(m.companySiret || m.professionalSiret) && (
                <p className="mt-0.5 text-xs text-slate-400">SIRET {m.companySiret || m.professionalSiret}</p>
              )}

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-slate-50 p-2 text-center text-xs">
                <div><div className="font-semibold text-ink">{m.missionsPublished}</div><div className="text-slate-400">Publiées</div></div>
                <div><div className="font-semibold text-ink">{m.missionsCompleted}</div><div className="text-slate-400">Réalisées</div></div>
                <div><div className="font-semibold text-ink">{m.revenue.toFixed(0)} €</div><div className="text-slate-400">CA</div></div>
              </div>

              <div className="mt-3 flex gap-2">
                <Link href={`/admin/members/${m.id}`} className="flex-1 rounded-md border border-slate-200 py-1.5 text-center text-xs font-medium text-ink hover:border-moss hover:text-moss-dark">
                  Voir le profil
                </Link>
                <a href={`mailto:${m.email}`} className="flex-1 rounded-md bg-moss py-1.5 text-center text-xs font-medium text-paper hover:bg-moss-dark">
                  Contacter
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && total > members.length && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40">← Précédent</button>
          <span className="text-slate-500">Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-slate-200 px-3 py-1.5 disabled:opacity-40">Suivant →</button>
        </div>
      )}
    </div>
  );
}
