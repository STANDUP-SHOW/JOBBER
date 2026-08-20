'use client';

import { useEffect, useState } from 'react';
import { useAgencyAuth } from '../../lib/agency-auth-context';
import { agencyApi } from '../../lib/agencyApi';
import { api } from '../../lib/api';

export default function PlanningPage() {
  const { token } = useAgencyAuth();
  const [plannings, setPlannings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  async function refresh() {
    try {
      const { plannings } = await agencyApi.plannings(token);
      setPlannings(plannings);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => {
    if (!token) return;
    api.categories().then(({ categories }) => setCategories(categories)).catch(() => {});
    refresh();
  }, [token]);

  async function createPlanning(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await agencyApi.createPlanning({ name, categoryId: categoryId || undefined }, token);
      setName(''); setCategoryId(''); setShowForm(false);
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Planning</h1>
        <button type="button" onClick={() => setShowForm((s) => !s)} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          + Ajouter un planning
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Les missions mises "en cours" sont attribuées à un planning — un par catégorie par défaut, ou un planning
        nommé pour un employé (ex. "Planning Emily").
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {showForm && (
        <form onSubmit={createPlanning} className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <input required placeholder="Nom du planning (ex. Planning Emily)" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
            <option value="">Catégorie (optionnel)</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <button type="submit" disabled={busy} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
            Créer
          </button>
        </form>
      )}

      {plannings === null && <p className="mt-6 text-sm text-slate-400">Chargement…</p>}
      {plannings?.length === 0 && <p className="mt-6 text-sm text-slate-400">Aucun planning créé pour l'instant.</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {plannings?.map((p) => (
          <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              {p.category?.icon && <span>{p.category.icon}</span>}
              <span className="font-display text-base font-semibold text-ink">{p.name}</span>
            </div>
            <div className="mt-3 space-y-2">
              {p.missions.length === 0 && <p className="text-sm text-slate-400">Aucune mission attribuée.</p>}
              {p.missions.map((m) => (
                <div key={m.id} className="rounded-md bg-paper px-3 py-2 text-sm">
                  <div className="font-medium text-ink">{m.title}</div>
                  <div className="text-xs text-slate-500">
                    {m.booking?.provider ? `${m.booking.provider.firstName} ${m.booking.provider.lastName?.[0]}.` : 'Traité en agence'} · {new Date(m.desiredDate).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
