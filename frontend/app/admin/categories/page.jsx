'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [newCategory, setNewCategory] = useState({ name: '', icon: '' });
  const [newServiceByCategory, setNewServiceByCategory] = useState({});
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { categories } = await api.categories();
    setCategories(categories);
  }

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, []);

  async function addCategory(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api.createCategory(newCategory, token);
      setNewCategory({ name: '', icon: '' });
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function removeCategory(id) {
    if (!confirm('Supprimer cette catégorie ? Impossible si des missions y sont rattachées.')) return;
    setBusy(true); setError('');
    try { await api.deleteCategory(id, token); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function addService(categoryId) {
    const name = newServiceByCategory[categoryId];
    if (!name?.trim()) return;
    setBusy(true); setError('');
    try {
      await api.createService(categoryId, name, token);
      setNewServiceByCategory({ ...newServiceByCategory, [categoryId]: '' });
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function removeService(id) {
    setBusy(true); setError('');
    try { await api.deleteService(id, token); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <form onSubmit={addCategory} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Icône (emoji)</span>
          <input
            value={newCategory.icon}
            onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
            placeholder="🧹"
            className="mt-1 w-20 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
          />
        </label>
        <label className="block flex-1 min-w-[200px]">
          <span className="text-xs font-medium text-slate-500">Nom de la catégorie</span>
          <input
            required value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            placeholder="Ex : Électricité"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
          />
        </label>
        <button disabled={busy} className="rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
          Ajouter
        </button>
      </form>

      {error && <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-6 space-y-4">
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <span className="font-display text-lg font-medium text-ink">{cat.name}</span>
              </div>
              <button onClick={() => removeCategory(cat.id)} className="text-xs font-medium text-clay hover:underline">
                Supprimer la catégorie
              </button>
            </div>

            <ul className="mt-3 space-y-1">
              {cat.services.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-sm">
                  <span>{s.name}</span>
                  <button onClick={() => removeService(s.id)} className="text-xs text-slate-400 hover:text-clay">Retirer</button>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex gap-2">
              <input
                value={newServiceByCategory[cat.id] || ''}
                onChange={(e) => setNewServiceByCategory({ ...newServiceByCategory, [cat.id]: e.target.value })}
                placeholder="Nouveau service…"
                className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-moss"
              />
              <button
                disabled={busy}
                onClick={() => addService(cat.id)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium hover:border-moss hover:text-moss-dark"
              >
                + Ajouter
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
