'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function ProviderProfilePage() {
  return (
    <Suspense fallback={<p className="text-slate-400">Chargement…</p>}>
      <ProfileForm />
    </Suspense>
  );
}

function ProfileForm() {
  const { user, token, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    address: '',
    bio: '',
    defaultHourlyRate: 15,
    radiusKm: 15,
    autoApply: false,
    categoryIds: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectError, setConnectError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    api.categories().then(({ categories }) => setCategories(categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token || !user) return;
    const profile = user.providerProfile;
    if (profile) {
      setForm({
        address: user.address || '',
        bio: profile.bio || '',
        defaultHourlyRate: profile.defaultHourlyRate ?? 15,
        radiusKm: profile.radiusKm ?? 15,
        autoApply: profile.autoApply ?? false,
        categoryIds: (profile.categories || []).map((c) => c.categoryId),
      });
    }
  }, [token, user]);

  // Coming back from Stripe's hosted onboarding — refresh the profile so
  // payoutsEnabled reflects whatever Stripe just confirmed.
  useEffect(() => {
    if (!token) return;
    const stripeStatus = searchParams.get('stripe');
    if (stripeStatus === 'return' || stripeStatus === 'refresh') {
      api.me(token).then(({ user: refreshed }) => login(token, refreshed)).catch(() => {});
    }
  }, [token]);

  function toggleCategory(id) {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((c) => c !== id)
        : [...f.categoryIds, id],
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      await api.updateProviderProfile(
        {
          address: form.address,
          bio: form.bio,
          defaultHourlyRate: Number(form.defaultHourlyRate),
          radiusKm: Number(form.radiusKm),
          autoApply: form.autoApply,
          categoryIds: form.categoryIds,
        },
        token
      );
      const { user: refreshed } = await api.me(token);
      login(token, refreshed);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onConnectPayments() {
    setConnectBusy(true);
    setConnectError('');
    try {
      const { url } = await api.connectOnboard(token);
      window.location.href = url;
    } catch (err) {
      setConnectError(err.message);
      setConnectBusy(false);
    }
  }

  if (!user) return null;

  const payoutsEnabled = user.providerProfile?.payoutsEnabled;
  const walletBalance = user.providerProfile?.walletBalance ?? 0;

  return (
    <div className="mx-auto max-w-xl">
      <span className="label-eyebrow text-moss">Mon profil</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Profil jobber</h1>
      <p className="mt-1 text-sm text-slate-500">Ces informations sont visibles par les clients et déterminent les missions qui vous sont proposées.</p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-display text-lg font-medium text-ink">Portefeuille</h2>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Solde disponible</div>
            <div className="mt-0.5 font-display text-3xl font-semibold text-ink">{walletBalance.toFixed(2)} €</div>
          </div>
          {payoutsEnabled ? (
            <span className="rounded-full bg-moss-light px-3 py-1.5 text-xs font-medium text-moss-dark">
              ✓ Paiements activés
            </span>
          ) : (
            <button
              type="button"
              disabled={connectBusy}
              onClick={onConnectPayments}
              className="rounded-md bg-moss px-4 py-2.5 text-sm font-medium text-paper hover:bg-moss-dark disabled:opacity-60"
            >
              {connectBusy ? 'Redirection…' : 'Configurer mes paiements'}
            </button>
          )}
        </div>
        {!payoutsEnabled && (
          <p className="mt-2 text-xs text-slate-400">
            Renseignez votre identité et vos coordonnées bancaires via Stripe (sécurisé, hébergé par Stripe) pour recevoir vos virements.
          </p>
        )}
        {connectError && <p className="mt-2 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{connectError}</p>}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Adresse</span>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            placeholder="Rue, ville, code postal"
          />
          <span className="mt-1 block text-xs text-slate-400">
            Utilisée pour centrer votre zone d'intervention sur la carte des missions.
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-500">Bio</span>
          <textarea
            rows={4}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            placeholder="Présentez votre expérience, vos compétences…"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Tarif horaire par défaut (€)</span>
            <input
              type="number" min="1" step="0.5"
              value={form.defaultHourlyRate}
              onChange={(e) => setForm({ ...form, defaultHourlyRate: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Zone d'intervention (km)</span>
            <input
              type="number" min="1" step="1"
              value={form.radiusKm}
              onChange={(e) => setForm({ ...form, radiusKm: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.autoApply}
            onChange={(e) => setForm({ ...form, autoApply: e.target.checked })}
            className="rounded border-slate-300"
          />
          Candidater automatiquement aux nouvelles missions de mes catégories
        </label>

        <div>
          <span className="text-xs font-medium text-slate-500">Catégories</span>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.categoryIds.includes(c.id)}
                  onChange={() => toggleCategory(c.id)}
                  className="rounded border-slate-300"
                />
                {c.icon} {c.name}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        {saved && <p className="rounded-md bg-moss-light px-3 py-2 text-sm text-moss-dark">Profil mis à jour.</p>}

        <button disabled={loading} className="w-full rounded-md bg-moss py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
