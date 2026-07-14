'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

const PLANS = [
  { value: 'MANAGER_BOSS', name: 'Manager Boss', price: 10, limit: '10 missions par mois' },
  { value: 'MANAGER_HOLDER', name: 'Manager Holder', price: 20, limit: 'Missions illimitées' },
];

const STATUS_LABEL = { ACTIVE: 'Actif', PAST_DUE: 'Paiement en retard', CANCELED: 'Résilié' };

export default function SubscriptionPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [hasCard, setHasCard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  async function refresh() {
    if (!token) return;
    const [{ subscription }, { paymentMethods }] = await Promise.all([
      api.getSubscription(token),
      api.paymentMethods(token),
    ]);
    setSubscription(subscription);
    setHasCard(paymentMethods.length > 0);
  }

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, [token]);

  async function onSubscribe(plan) {
    setBusy(true);
    setError('');
    try {
      await api.subscribe(plan, token);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function onCancel() {
    setBusy(true);
    setError('');
    try {
      await api.cancelSubscription(token);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const isActive = subscription?.status === 'ACTIVE';
  const limit = subscription?.plan === 'MANAGER_BOSS' ? 10 : Infinity;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Abonnement Manager</h1>
      <p className="mt-2 text-sm text-slate-500">
        Plus aucun frais de mise en relation sur vos missions, dans la limite de votre offre.
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {isActive && (
        <div className="mt-5 rounded-lg border border-moss bg-moss-light p-4">
          <div className="flex items-center justify-between">
            <div className="font-display text-lg font-semibold text-ink">
              {PLANS.find((p) => p.value === subscription.plan)?.name}
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-moss-dark">
              {STATUS_LABEL[subscription.status]}
            </span>
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {subscription.missionsUsedInPeriod}{limit === Infinity ? '' : ` / ${limit}`} missions sans frais utilisées ce mois-ci
          </div>
          <div className="text-xs text-slate-500">
            Renouvellement le {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="mt-3 text-sm font-medium text-clay disabled:opacity-60"
          >
            Résilier l'abonnement
          </button>
        </div>
      )}

      {!isActive && hasCard === false && (
        <p className="mt-5 rounded-md bg-ochre/10 px-3 py-2 text-sm text-ink">
          Ajoutez d'abord un <Link href="/account/payment-methods" className="font-medium text-moss">moyen de paiement</Link> pour souscrire.
        </p>
      )}

      <div className="mt-5 space-y-3">
        {PLANS.map((plan) => (
          <div key={plan.value} className={`rounded-lg border p-4 ${subscription?.plan === plan.value && isActive ? 'border-moss' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-display text-lg font-semibold text-ink">{plan.name}</div>
                <div className="text-sm text-slate-500">{plan.limit} · plus aucun frais</div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-bold text-ink">{plan.price} €</div>
                <div className="text-xs text-slate-400">/ mois</div>
              </div>
            </div>
            {!(subscription?.plan === plan.value && isActive) && (
              <button
                type="button"
                disabled={busy || hasCard === false}
                onClick={() => onSubscribe(plan.value)}
                className="mt-3 w-full rounded-md bg-moss py-2.5 text-sm font-medium text-white hover:bg-moss-dark disabled:opacity-60"
              >
                {busy ? 'Traitement…' : isActive ? 'Changer pour cette offre' : "S'abonner"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
