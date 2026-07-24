'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import AddressAutocomplete from '../../components/AddressAutocomplete';

const ALLOWED_SLUGS = ['bricolage', 'menage', 'jardinage', 'piscine', 'conciergerie'];

export default function DemandePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: '', serviceId: '', title: '', description: '', address: '',
    desiredDate: '', desiredTime: '10:00', estimatedHours: 2,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.categories().then(({ categories }) => {
      setCategories(categories.filter((c) => ALLOWED_SLUGS.includes(c.slug)));
    }).catch(() => {});
  }, []);

  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (!user) {
      router.push('/auth/register?next=/demande');
      return;
    }

    setLoading(true);
    try {
      const [year, month, day] = form.desiredDate.split('-').map(Number);
      const [hour, minute] = form.desiredTime.split(':').map(Number);
      const desiredDateTime = new Date(year, month - 1, day, hour, minute).toISOString();

      await api.createMission(
        {
          categoryId: form.categoryId,
          serviceId: form.serviceId || undefined,
          title: form.title,
          description: form.description,
          address: form.address,
          desiredDate: desiredDateTime,
          estimatedHours: Number(form.estimatedHours),
        },
        token
      );
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center">
        <span className="text-4xl">✅</span>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Votre demande a bien été envoyée</h1>
        <p className="mt-2 text-slate-500">
          Un agent Services 34 va l'examiner et revient vers vous rapidement pour confirmer l'intervention.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <span className="label-eyebrow text-brand">Demande d'intervention</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Décrivez votre besoin</h1>
      <p className="mt-1 text-sm text-slate-500">Un agent Services 34 vous recontacte pour confirmer votre intervention.</p>

      {!authLoading && !user && (
        <p className="mt-4 rounded-md bg-accent-light px-4 py-3 text-sm text-accent-dark">
          Vous devrez <a href="/auth/register?next=/demande" className="font-medium underline">créer votre compte</a> pour envoyer votre demande — vous ne perdrez pas votre saisie.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Service</span>
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value, serviceId: '' })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Choisir…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </label>

        {selectedCategory && (
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Prestation précise (optionnel)</span>
            <select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            >
              <option value="">Non précisé</option>
              {selectedCategory.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}

        <label className="block">
          <span className="text-xs font-medium text-slate-500">Titre de la demande</span>
          <input
            required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ex : Tonte de pelouse et taille de haie"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-500">Description</span>
          <textarea
            required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Détaillez votre besoin, l'accès au logement…"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-500">Adresse</span>
          <AddressAutocomplete value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Date souhaitée</span>
            <input
              type="date" required value={form.desiredDate} onChange={(e) => setForm({ ...form, desiredDate: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Heure</span>
            <input
              type="time" required value={form.desiredTime} onChange={(e) => setForm({ ...form, desiredTime: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        </div>

        <label className="block max-w-[10rem]">
          <span className="text-xs font-medium text-slate-500">Durée estimée (heures)</span>
          <input
            type="number" min={1} required value={form.estimatedHours}
            onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button disabled={loading} className="w-full rounded-md bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60">
          {loading ? 'Envoi…' : user ? 'Envoyer ma demande' : 'Continuer'}
        </button>
      </form>
    </div>
  );
}
