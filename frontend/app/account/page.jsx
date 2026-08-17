'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import AvatarUpload from '../../components/AvatarUpload';
import ZoneSummaryCard from '../../components/ZoneSummaryCard';
import SubscriptionBadge from '../../components/SubscriptionBadge';

function DashboardCard({ icon, iconCls, label, value, caption }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${iconCls}`}>{icon}</span>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-2 font-display text-xl font-bold text-ink">{value}</div>
      {caption && <div className="text-xs text-slate-400">{caption}</div>}
    </div>
  );
}

export default function AccountPage() {
  const { user, token, login, logout, loading } = useAuth();
  const router = useRouter();
  const [tier, setTier] = useState(null);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user]);

  const isCompany = user?.accountKind === 'COMPANY';

  // Whichever family applies to this account's own role: Manager/Entreprise
  // accounts show their MANAGER-family plan, everyone else their
  // JOBBER-family "carte jobber" — same split as the top header.
  useEffect(() => {
    if (!token || !user) return;
    api.getSubscription(token)
      .then(({ subscription, jobberSubscription }) => setTier((isCompany ? subscription : jobberSubscription)?.plan || null))
      .catch(() => setTier(null));
  }, [token, user, isCompany]);

  if (!user) return null;

  async function onAvatarUploaded(url) {
    const { user: updated } = await api.updateMe({ avatarUrl: url }, token);
    login(token, updated);
  }

  return (
    <div className="max-w-3xl">
      <AvatarUpload avatarUrl={user.avatarUrl} firstName={user.firstName} onUploaded={onAvatarUploaded} />

      <div className="mt-4 flex items-center gap-3">
        <h1 className="font-display text-3xl font-semibold text-ink">
          {isCompany ? user.companyName : `Bonjour ${user.firstName}`}
        </h1>
        {isCompany && (
          <span className="rounded-full bg-moss px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {user.companyType === 'CORPORATE' ? 'Corporate' : 'Entreprise'}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {isCompany
          ? 'Recrutez vos collaborateurs à la tâche, légalement, sur devis et facture.'
          : 'Publiez des besoins et proposez vos services, le tout depuis un seul compte.'}
      </p>

      {!isCompany && (
        <div className="mt-4">
          <ZoneSummaryCard />
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <DashboardCard icon="💰" iconCls="bg-moss-light text-moss-dark" label="Mon solde" value={`${(user.creditBalance ?? 0).toFixed(2)} €`} />
        {!isCompany && (
          <DashboardCard
            icon="💶"
            iconCls="bg-ochre-light text-ochre-dark"
            label="Mon portefeuille"
            value={`${(user.providerProfile?.walletBalance ?? 0).toFixed(2)} €`}
            caption={user.providerProfile?.payoutsEnabled ? 'Paiements activés' : 'Paiements non configurés'}
          />
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-base text-indigo-600">💼</span>
            <span className="text-xs font-medium text-slate-500">{isCompany ? 'Carte Manager' : 'Carte jobber'}</span>
          </div>
          <div className="mt-2">
            {tier ? <SubscriptionBadge plan={tier} /> : <span className="text-sm text-slate-400">Aucune carte active</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
