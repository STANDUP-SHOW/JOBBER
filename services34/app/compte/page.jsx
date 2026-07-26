'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

const STATUS_LABELS = {
  OPEN: 'En attente',
  ASSIGNED: 'Agent trouvé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export default function ComptePage() {
  const { user, token, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?next=/compte');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!token || !user) return;
    api
      .myMissions(user.id, token)
      .then(({ missions }) => setMissions(missions))
      .catch((err) => setError(err.message));
  }, [token, user]);

  if (authLoading || !user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <span className="label-eyebrow text-brand">Mon compte</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Bonjour {user.firstName}</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/demande" className="rounded-md bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark">
          Publier un besoin
        </Link>
        <button
          type="button"
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="rounded-md border border-slate-200 px-5 py-3 font-medium text-ink hover:border-slate-300"
        >
          Se déconnecter
        </button>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Mes demandes en cours</h2>

        {error && <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        {missions === null && !error && <p className="mt-3 text-sm text-slate-400">Chargement…</p>}

        {missions?.length === 0 && (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Vous n'avez pas encore de demande.{' '}
            <Link href="/demande" className="font-medium text-brand hover:underline">
              Publier un besoin
            </Link>
          </p>
        )}

        <div className="mt-4 space-y-3">
          {missions?.map((m) => (
            <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-ink">
                    {m.category?.icon} {m.title}
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500">
                    {new Date(m.desiredDate).toLocaleDateString('fr-FR')} · {m.estimatedHours} h
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {STATUS_LABELS[m.status] || m.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
