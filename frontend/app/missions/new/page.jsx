'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function NewMissionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: searchParams.get('categoryId') || '',
    serviceId: '',
    title: '',
    description: '',
    address: '',
    desiredDate: '',
    estimatedHours: 2,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.categories().then(({ categories }) => setCategories(categories)).catch(() => {});
  }, []);

  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  async function onSubmit(e) {
    e.preventDefault();
    if (!user) { router.push('/auth/login'); return; }
    setError('');
    setLoading(true);
    try {
      const { mission } = await api.createMission(
        { ...form, estimatedHours: Number(form.estimatedHours) },
        token
      );
      router.push(`/missions/${mission.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <span className="label-eyebrow text-moss">Publier un besoin</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Décrivez votre mission</h1>
      <p className="mt-1 text-sm text-slate-500">Les prestataires disponibles pourront vous proposer leur tarif horaire.</p>

      {!authLoading && !user && (
        <p className="mt-4 rounded-md bg-ochre-light px-4 py-3 text-sm text-ochre-dark">
          Vous devrez vous <a href="/auth/login" className="font-medium underline">connecter</a> pour publier — vous ne perdrez pas votre saisie.
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Catégorie</span>
          <select
            required value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value, serviceId: '' })}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
          >
            <option value="">Choisir…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </label>

        {selectedCategory?.services?.length > 0 && (
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Service précis (optionnel)</span>
            <select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
            >
              <option value="">Non précisé</option>
              {selectedCategory.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}

        <Field label="Titre" value={form.title} onChange={(v) => setForm({ ...form, title: v })} required placeholder="Ex : Montage de meubles de cuisine" />
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Description</span>
          <textarea
            required rows={4} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            placeholder="Détaillez la tâche, le matériel disponible, l'accès au logement…"
          />
        </label>
        <Field label="Adresse" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required placeholder="Rue, ville" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date souhaitée" type="date" value={form.desiredDate} onChange={(v) => setForm({ ...form, desiredDate: v })} required />
          <Field label="Durée estimée (heures)" type="number" min="0.5" step="0.5" value={form.estimatedHours} onChange={(v) => setForm({ ...form, estimatedHours: v })} required />
        </div>

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button disabled={loading} className="w-full rounded-md bg-ink py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
          {loading ? 'Publication…' : 'Publier la mission'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, placeholder, min, step }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        type={type} required={required} placeholder={placeholder} min={min} step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
      />
    </label>
  );
}
