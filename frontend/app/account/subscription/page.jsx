'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import { SUBSCRIPTION_COLORS } from '../../../lib/subscriptionColors';
import AccountBackButton from '../../../components/AccountBackButton';
import SubscribeModal from '../../../components/SubscribeModal';

const MANAGER_PLANS = [
  { value: 'MANAGER_BOSS', name: 'Manager Boss', price: 10, limit: '10 missions par mois' },
  { value: 'MANAGER_HOLDER', name: 'Manager Holder', price: 20, limit: 'Missions illimitées', recommended: true },
];

const JOBBER_PLANS = [
  { value: 'JOBBER_SILVER', name: 'Jobber Silver', price: 15, limit: '10 missions par mois' },
  { value: 'JOBBER_GOLD', name: 'Jobber Gold', price: 20, limit: '20 missions par mois', recommended: true },
  { value: 'JOBBER_PLATINUM', name: 'Jobber Platine', price: 29.99, limit: 'Missions illimitées' },
];

const COMPANY_PLANS = [
  { value: 'ENTERPRISE_20', name: 'Entreprise 20', price: 99.9, limit: '20 missions par mois' },
  { value: 'ENTERPRISE_50', name: 'Entreprise 50', price: 199.9, limit: '50 missions par mois' },
  { value: 'ENTERPRISE_UNLIMITED', name: 'Entreprise Illimité', price: 499.9, limit: 'Missions illimitées, tout inclus', recommended: true },
];

const PLAN_LIMIT_VALUES = {
  MANAGER_BOSS: 10, MANAGER_HOLDER: Infinity,
  ENTERPRISE_20: 20, ENTERPRISE_50: 50, ENTERPRISE_UNLIMITED: Infinity,
  JOBBER_SILVER: 10, JOBBER_GOLD: 20, JOBBER_PLATINUM: Infinity,
};

const STATUS_LABEL = { ACTIVE: 'Actif', PAST_DUE: 'Paiement en retard', CANCELED: 'Résilié' };

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
    </svg>
  );
}

function PlanSection({ title, description, plans, subscription, busy, onSubscribe, onCancel }) {
  const isActive = subscription?.status === 'ACTIVE';
  const limit = PLAN_LIMIT_VALUES[subscription?.plan] ?? Infinity;

  return (
    <div className="mt-8">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>

      {isActive && (
        <div
          className="mt-4 rounded-2xl p-4"
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
            Résilier la carte
          </button>
        </div>
      )}

      <div className={`mt-4 grid gap-4 ${plans.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
        {plans.map((plan) => {
          const color = SUBSCRIPTION_COLORS[plan.value];
          const isCurrent = subscription?.plan === plan.value && isActive;
          return (
            <div
              key={plan.value}
              className={`relative flex flex-col rounded-2xl p-5 ${color ? '' : 'border border-slate-200 bg-white'} ${
                isCurrent ? 'ring-2 ring-offset-2 ring-ink' : plan.recommended ? 'shadow-lg' : ''
              }`}
              style={color ? { backgroundColor: color.bg, color: color.text } : undefined}
            >
              {plan.recommended && !isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Recommandé
                </span>
              )}
              <div className="font-display text-base font-bold">{plan.name}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-extrabold">{plan.price.toFixed(2).replace('.', ',')} €</span>
                <span className={`text-sm ${color ? 'opacity-75' : 'text-slate-400'}`}>/ mois</span>
              </div>
              <ul className="mt-4 flex-1 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckIcon className={`h-4 w-4 shrink-0 ${color ? '' : 'text-moss'}`} />
                  {plan.limit}
                </li>
                <li className="flex items-center gap-2">
                  <CheckIcon className={`h-4 w-4 shrink-0 ${color ? '' : 'text-moss'}`} />
                  Plus aucun frais de plateforme
                </li>
              </ul>
              {isCurrent ? (
                <span className="mt-4 rounded-md bg-white/90 py-2.5 text-center text-sm font-medium text-ink">
                  Offre actuelle
                </span>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onSubscribe(plan)}
                  className="mt-4 w-full rounded-md bg-white/90 py-2.5 text-sm font-medium text-ink hover:bg-white disabled:opacity-60"
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
  const [savedCard, setSavedCard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [subscribingPlan, setSubscribingPlan] = useState(null);

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
    setSavedCard(paymentMethods.find((m) => m.isDefault) || paymentMethods[0] || null);
  }

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, [token]);

  function onSubscribed() {
    setSubscribingPlan(null);
    refresh().catch((e) => setError(e.message));
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
    <div className="mx-auto max-w-3xl">
      <AccountBackButton />
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{isCompany ? 'Carte Entreprise' : 'Cartes'}</h1>
      <p className="mt-2 text-sm text-slate-500">
        {isCompany
          ? 'Sans carte, chaque mission coûte 10 € de frais (gratuit pour le jobber). Ces formules suppriment ces frais dans la limite de votre offre.'
          : "La version gratuite de Jobber donne accès à toutes les fonctionnalités. Ces formules suppriment uniquement les frais prélevés sur vos missions."}
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {isCompany ? (
        <PlanSection
          title="Carte Entreprise"
          description="Sans carte, 10 € de frais par mission (gratuit pour le jobber)."
          plans={COMPANY_PLANS}
          subscription={subscription}
          busy={busy}
          onSubscribe={setSubscribingPlan}
          onCancel={() => onCancel('MANAGER')}
        />
      ) : (
        <>
          <PlanSection
            title="Cartes Manager"
            description="Sans carte, 2,50 € de frais sont prélevés à chaque mission que vous publiez."
            plans={MANAGER_PLANS}
            subscription={subscription}
            busy={busy}
            onSubscribe={setSubscribingPlan}
            onCancel={() => onCancel('MANAGER')}
          />
          <PlanSection
            title="Cartes Jobber"
            description="Sans carte, 2,50 € de frais sont prélevés à chaque mission que vous décrochez."
            plans={JOBBER_PLANS}
            subscription={jobberSubscription}
            busy={busy}
            onSubscribe={setSubscribingPlan}
            onCancel={() => onCancel('JOBBER')}
          />
        </>
      )}

      {subscribingPlan && (
        <SubscribeModal
          plan={subscribingPlan}
          token={token}
          balance={user.creditBalance ?? 0}
          savedCard={savedCard}
          onClose={() => setSubscribingPlan(null)}
          onSubscribed={onSubscribed}
        />
      )}
    </div>
  );
}
