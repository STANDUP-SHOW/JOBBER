'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function BadgesPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
    else if (user?.accountKind === 'COMPANY') router.push('/account');
  }, [authLoading, user]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.myBadges(token)
      .then(({ badges }) => setBadges(badges))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm text-slate-400 hover:text-moss">← Mon compte</Link>
      <span className="mt-4 block label-eyebrow text-moss">Espace Jobber</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Mes badges et récompenses</h1>
      <p className="mt-1 text-sm text-slate-500">Débloqués automatiquement selon votre activité.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`flex flex-col items-center rounded-lg border p-4 text-center ${b.earned ? 'border-moss bg-moss-light/40' : 'border-slate-200 bg-white opacity-50'}`}
          >
            <span className="text-3xl">{b.icon}</span>
            <span className="mt-2 text-sm font-semibold text-ink">{b.name}</span>
            <span className="mt-1 text-xs text-slate-500">{b.description}</span>
            {b.earned && <span className="mt-2 text-[10px] font-medium uppercase tracking-wide text-moss-dark">Débloqué</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
