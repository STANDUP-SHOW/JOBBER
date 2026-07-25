'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import { VEHICLES } from '../../../components/VehicleIcon';

function emptyDate() {
  return { date: '', startTime: '09:00', hours: 2, endTime: '11:00' };
}

export default function EmployesPage() {
  const { token } = useAgencyAuth();
  const [employees, setEmployees] = useState(null);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [materielFilter, setMaterielFilter] = useState('');
  const [vehiculeFilter, setVehiculeFilter] = useState('');
  const [embaucheFor, setEmbaucheFor] = useState(null); // jobberId currently being scheduled
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({ categoryId: '', title: '', description: '', address: '', dates: [emptyDate()] });

  useEffect(() => {
    if (!token) return;
    agencyApi.employees(token).then(({ employees }) => setEmployees(employees)).catch((e) => setError(e.message));
  }, [token]);

  const categories = useMemo(() => {
    const set = new Map();
    employees?.forEach((e) => e.jobber.providerProfile?.categories?.forEach((c) => set.set(c.categoryId, c.category?.name)));
    return Array.from(set, ([id, name]) => ({ id, name }));
  }, [employees]);

  const filtered = employees?.filter((e) => {
    const profile = e.jobber.providerProfile;
    if (categoryFilter && !profile?.categories?.some((c) => c.categoryId === categoryFilter)) return false;
    if (materielFilter === 'equipe' && !(profile?.equipment?.length > 0)) return false;
    if (materielFilter === 'non-equipe' && profile?.equipment?.length > 0) return false;
    if (vehiculeFilter && !profile?.vehicles?.some((v) => v.type === vehiculeFilter)) return false;
    return true;
  });

  function openEmbauche(jobberId, categoryId) {
    setEmbaucheFor(jobberId);
    setForm({ categoryId: categoryId || '', title: '', description: '', address: '', dates: [emptyDate()] });
    setMessage('');
  }

  function addDate() {
    setForm((f) => ({ ...f, dates: [...f.dates, emptyDate()] }));
  }

  function updateDate(i, field, value) {
    setForm((f) => ({ ...f, dates: f.dates.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)) }));
  }

  async function submitEmbauche(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await agencyApi.embauche(embaucheFor, {
        categoryId: form.categoryId,
        title: form.title,
        description: form.description,
        address: form.address,
        dates: form.dates.map((d) => ({ ...d, hours: Number(d.hours) })),
      }, token);
      setMessage('Mission planning envoyée au jobber — il peut l\'accepter ou la refuser.');
      setEmbaucheFor(null);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Mes employés</h1>
      <p className="mt-1 text-sm text-slate-500">Jobbers ajoutés à votre vivier de confiance après une mission réussie.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {message && <p className="mt-4 rounded-md bg-brand-light px-3 py-2 text-sm text-brand-dark">{message}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={materielFilter} onChange={(e) => setMaterielFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
          <option value="">Matériel : tous</option>
          <option value="equipe">Équipé</option>
          <option value="non-equipe">Non équipé</option>
        </select>
        <select value={vehiculeFilter} onChange={(e) => setVehiculeFilter(e.target.value)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
          <option value="">Véhicule : tous</option>
          {VEHICLES.map((v) => <option key={v.type} value={v.type}>{v.label}</option>)}
        </select>
      </div>

      {employees === null && <p className="mt-6 text-sm text-slate-400">Chargement…</p>}
      {filtered?.length === 0 && <p className="mt-6 text-sm text-slate-400">Aucun employé ne correspond à ces filtres.</p>}

      <div className="mt-6 space-y-3">
        {filtered?.map(({ jobber }) => (
          <div key={jobber.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-medium text-ink">{jobber.firstName} {jobber.lastName?.[0]}.</div>
                <div className="text-sm text-slate-500">
                  {jobber.providerProfile?.categories?.map((c) => c.category?.name).join(', ') || 'Aucune catégorie'}
                  {' · '}
                  {jobber.providerProfile?.equipment?.length > 0 ? 'Équipé' : 'Non équipé'}
                  {jobber.providerProfile?.vehicles?.length > 0 && ` · ${jobber.providerProfile.vehicles.length} véhicule(s)`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => openEmbauche(jobber.id, jobber.providerProfile?.categories?.[0]?.categoryId)}
                className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Embaucher pour une mission
              </button>
            </div>

            {embaucheFor === jobber.id && (
              <form onSubmit={submitEmbauche} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <input required placeholder="Titre de la mission" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
                <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
                <input required placeholder="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />

                <div>
                  <span className="text-xs font-medium text-slate-500">Planning — plusieurs missions, plusieurs jours</span>
                  <div className="mt-2 space-y-2">
                    {form.dates.map((d, i) => (
                      <div key={i} className="flex flex-wrap items-center gap-2">
                        <input type="date" required value={d.date} onChange={(e) => updateDate(i, 'date', e.target.value)} className="rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                        <input type="time" required value={d.startTime} onChange={(e) => updateDate(i, 'startTime', e.target.value)} className="w-28 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                        <input type="number" min={0.5} step={0.5} required value={d.hours} onChange={(e) => updateDate(i, 'hours', e.target.value)} className="w-20 rounded-md border border-slate-200 px-2 py-1.5 text-sm" placeholder="Heures" />
                        <input type="time" required value={d.endTime} onChange={(e) => updateDate(i, 'endTime', e.target.value)} className="w-28 rounded-md border border-slate-200 px-2 py-1.5 text-sm" />
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addDate} className="mt-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-ink hover:border-slate-300">
                    + Ajouter une date
                  </button>
                </div>

                <div className="flex gap-3">
                  <button type="submit" disabled={busy} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
                    {busy ? 'Envoi…' : 'Envoyer au jobber'}
                  </button>
                  <button type="button" onClick={() => setEmbaucheFor(null)} className="text-sm text-slate-400 hover:text-ink">
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
