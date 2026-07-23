'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { SUBSCRIPTION_COLORS } from '../../../lib/subscriptionColors';

const MANAGER_PLANS = [
  { value: 'MANAGER_BOSS', name: 'Manager Boss', price: 10, limit: '10 missions par mois' },
  { value: 'MANAGER_HOLDER', name: 'Manager Holder', price: 20, limit: 'Missions illimitées' },
];

const JOBBER_PLANS = [
  { value: 'JOBBER_SILVER', name: 'Jobber Silver', price: 15, limit: '10 missions par mois' },
  { value: 'JOBBER_GOLD', name: 'Jobber Gold', price: 20, limit: '20 missions par mois' },
  { value: 'JOBBER_PLATINUM', name: 'Jobber Platine', price: 29.99, limit: 'Missions illimitées' },
];

const COMPANY_PLANS = [
  { value: 'ENTERPRISE_20', name: 'Entreprise 20', price: 49.9, limit: '20 missions par mois' },
  { value: 'ENTERPRISE_50', name: 'Entreprise 50', price: 99.9, limit: '50 missions par mois' },
  { value: 'ENTERPRISE_UNLIMITED', name: 'Entreprise Illimité', price: 149.9, limit: 'Missions illimitées' },
];

const PLAN_LIMIT_VALUES = {
  MANAGER_BOSS: 10, MANAGER_HOLDER: Infinity,
  ENTERPRISE_20: 20, ENTERPRISE_50: 50, ENTERPRISE_UNLIMITED: Infinity,
  JOBBER_SILVER: 10, JOBBER_GOLD: 20, JOBBER_PLATINUM: Infinity,
};

const STATUS_LABEL = { ACTIVE: 'Actif', PAST_DUE: 'Paiement en retard', CANCELED: 'Résilié' };

function PlanSection({ title, description, plans, subscription, busy, hasCard, onSubscribe, onCancel }) {
  const isActive = subscription?.status === 'ACTIVE';
  const limit = PLAN_LIMIT_VALUES[subscription?.plan] ?? Infinity;

  return (
    <div className="mt-8">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      {isActive && (
        <div
          className="mt-4 rounded-lg p-4"
          style={SUBSCRIPTION_COLORS[subscription.plan] ? { backgroundColor: SUBSCRIPTION_COLORS[subscription.plan].bg, color: SUBSCRIPTION_COLORS[subscription.plan].text } : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="font-display text-lg font-bold">
              {plans.find((p) => p.value === subscription.plan)?.name}
            </div>
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink">
              {STATUS_LABEL[subscription.status]}
            </span>
          </div>
          <div className="mt-1 text-sm opacity-90">
            {subscription.missionsUsedInPeriod}{limit === Infinity ? '' : ` / ${limit}`} missions sans frais utilisées ce mois-ci
          </div>
          <div className="text-xs opacity-75">
            Renouvellement le {new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="mt-3 text-sm font-medium underline disabled:opacity-60"
          >
            Résilier l'abonnement
          </button>
        </div>
      )}

      {!isActive && hasCard === false && (
        <p className="mt-4 rounded-md bg-ochre/10 px-3 py-2 text-sm text-ink">
          Ajoutez d'abord un <Link href="/account/payment-methods" className="font-medium text-moss">moyen de paiement</Link> pour souscrire.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {plans.map((plan) => {
          const color = SUBSCRIPTION_COLORS[plan.value];
          const isCurrent = subscription?.plan === plan.value && isActive;
          return (
            <div
              key={plan.value}
              className={`rounded-lg p-4 ${color ? '' : 'border border-slate-200 bg-white'} ${isCurrent ? 'ring-2 ring-offset-2 ring-ink' : ''}`}
              style={color ? { backgroundColor: color.bg, color: color.text } : undefined}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-lg font-bold">{plan.name}</div>
                  <div className={`text-sm ${color ? 'opacity-90' : 'text-slate-500'}`}>{plan.limit} · plus aucun frais</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-bold">{plan.price.toFixed(2).replace('.', ',')} €</div>
                  <div className={`text-xs ${color ? 'opacity-75' : 'text-slate-400'}`}>/ mois</div>
                </div>
              </div>
              {!isCurrent && (
                <button
                  type="button"
                  disabled={busy || hasCard === false}
                  onClick={() => onSubscribe(plan.value)}
                  className="mt-3 w-full rounded-md bg-white/90 py-2.5 text-sm font-medium text-ink hover:bg-white disabled:opacity-60"
                >
                  {busy ? 'Traitement…' : isActive ? 'Changer pour cette offre' : "S'abonner"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [jobberSubscription, setJobberSubscription] = useState(null);
  const [hasCard, setHasCard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  async function refresh() {
    if (!token) return;
    const [{ subscription, jobberSubscription }, { paymentMethods }] = await Promise.all([
      api.getSubscription(token),
      api.paymentMethods(token),
    ]);
    setSubscription(subscription);
    setJobberSubscription(jobberSubscription);
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

  async function onCancel(family) {
    setBusy(true);
    setError('');
    try {
      await api.cancelSubscription(family, token);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!user) return null;

  const isCompany = user.accountKind === 'COMPANY';

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{isCompany ? 'Abonnement Entreprise' : 'Abonnements'}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {isCompany
          ? 'Sans abonnement, chaque mission coûte 10 € de frais (gratuit pour le jobber). Ces formules suppriment ces frais dans la limite de votre offre.'
          : "La version gratuite de Jobber donne accès à toutes les fonctionnalités. Ces formules suppriment uniquement les frais prélevés sur vos missions."}
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {isCompany ? (
        <PlanSection
          title="Abonnement Entreprise"
          description="Sans abonnement, 10 € de frais par mission (gratuit pour le jobber)."
          plans={COMPANY_PLANS}
          subscription={subscription}
          busy={busy}
          hasCard={hasCard}
          onSubscribe={onSubscribe}
          onCancel={() => onCancel('MANAGER')}
        />
      ) : (
        <>
          <PlanSection
            title="Abonnements Manager"
            description="Sans abonnement, 2,50 € de frais sont prélevés à chaque mission que vous publiez."
            plans={MANAGER_PLANS}
            subscription={subscription}
            busy={busy}
            hasCard={hasCard}
            onSubscribe={onSubscribe}
            onCancel={() => onCancel('MANAGER')}
          />
          <PlanSection
            title="Abonnements Jobber"
            description="Sans abonnement, 2,50 € de frais sont prélevés à chaque mission que vous décrochez."
            plans={JOBBER_PLANS}
            subscription={jobberSubscription}
            busy={busy}
            hasCard={hasCard}
            onSubscribe={onSubscribe}
            onCancel={() => onCancel('JOBBER')}
          />
        </>
      )}
    </div>
  );
}
