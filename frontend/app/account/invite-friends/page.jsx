'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function InviteFriendsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (!token) return;
    api.myReferral(token).then(setData).catch((e) => setError(e.message));
  }, [token]);

  if (!user) return null;

  const link = data && typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${data.code}` : '';
  const pending = data?.referrals.filter((r) => !r.active).length ?? 0;

  async function onInvite() {
    if (navigator.share) {
      try { await navigator.share({ title: 'Rejoins-moi sur Jobber', url: link }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>

      <h1 className="mt-4 font-display text-2xl font-semibold text-ink">
        Gagnez 5 % du montant dépensé par vos amis, à vie.
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Invitez vos amis : offrez-leur 3 € à utiliser sur leur premier service et récoltez 5 % du montant de toutes leurs prestations, à vie.
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-5 grid grid-cols-2 divide-x divide-slate-100 rounded-lg border border-slate-200 bg-white py-4 text-center">
        <div>
          <div className="font-display text-2xl font-bold text-ink">{(data?.totalEarned ?? 0).toFixed(2)} €</div>
          <div className="text-xs text-slate-400">Déjà gagné</div>
        </div>
        <div>
          <div className="font-display text-2xl font-bold text-ink">{data?.referrals.length ?? 0}</div>
          <div className="text-xs text-slate-400">Filleuls</div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-ink">Filleuls</h2>
        <span className="text-sm font-medium text-moss">En attente ({pending})</span>
      </div>

      {data?.referrals.length ? (
        <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {data.referrals.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-moss-light font-display text-sm text-moss-dark">
                {r.firstName?.[0]}
              </div>
              <div className="min-w-0 flex-1 text-sm font-medium text-ink">{r.firstName}</div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.active ? 'bg-moss-light text-moss-dark' : 'bg-slate-100 text-slate-500'}`}>
                {r.active ? 'Actif' : 'En attente'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-400">
          Vous n'avez pas encore de filleul.
        </p>
      )}

      <button
        type="button"
        onClick={onInvite}
        className="mt-6 w-full rounded-full bg-moss py-4 text-base font-semibold text-white hover:bg-moss-dark"
      >
        {copied ? 'Lien copié !' : 'Inviter des amis'}
      </button>
    </div>
  );
}
