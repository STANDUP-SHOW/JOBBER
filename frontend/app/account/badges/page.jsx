'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import AccountBackButton from '../../../components/AccountBackButton';
import { BADGE_CATEGORY_LABELS } from '../../../lib/badgeCatalog';

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

  const earnedCount = badges.filter((b) => b.earned).length;
  const byCategory = badges.reduce((acc, b) => {
    (acc[b.category] ||= []).push(b);
    return acc;
  }, {});

  return (
    <div className="max-w-xl">
      <AccountBackButton />
      <span className="mt-4 block label-eyebrow text-moss">Espace Jobber</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Mes badges et récompenses</h1>
      <p className="mt-1 text-sm text-slate-500">
        Débloqués automatiquement selon votre activité{badges.length > 0 && ` — ${earnedCount} / ${badges.length} débloqués`}.
        Ces badges s'affichent aussi sur votre profil public et sur les vignettes de mission.
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {Object.entries(byCategory).map(([category, categoryBadges]) => (
        <div key={category} className="mt-6">
          <h2 className="text-sm font-semibold text-slate-500">{BADGE_CATEGORY_LABELS[category] || category}</h2>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categoryBadges.map((b) => (
              <div
                key={b.key}
                className={`flex flex-col items-center rounded-lg p-4 text-center ${b.earned ? `${b.color?.bg} ${b.color?.text}` : 'border border-slate-200 bg-white text-ink opacity-50'}`}
              >
                <span className="text-3xl">{b.icon}</span>
                <span className="mt-2 text-sm font-semibold">{b.name}</span>
                <span className={`mt-1 text-xs ${b.earned ? 'opacity-90' : 'text-slate-500'}`}>{b.label}</span>
                {b.earned && <span className="mt-2 text-[10px] font-medium uppercase tracking-wide opacity-90">Débloqué</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
