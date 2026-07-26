'use client';

import { useEffect, useState } from 'react';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';
import { api } from '../../../lib/api';
import RecurringDatesEditor from '../../../components/admin/RecurringDatesEditor';
import MissionExtraFields from '../../../components/admin/MissionExtraFields';
import AddressAutocomplete from '../../../components/AddressAutocomplete';

function emptyDate() {
  return { date: '', startTime: '09:00', hours: 2, endTime: '11:00' };
}

function emptyForm() {
  return {
    categoryId: '', serviceId: '', details: {}, title: '', description: '', address: '',
    estimatedHours: 2, desiredDate: '', isRecurring: false, dates: [emptyDate()],
    isUrgent: false, datesFlexible: false, workAtHeight: null,
    requiredEquipmentIds: [], otherEquipmentChecked: false, otherEquipmentNote: '',
    requiredVehicleTypes: [], otherVehicleChecked: false, otherVehicleNote: '',
  };
}

export default function NouvelleMissionAgencePage() {
  const { token } = useAgencyAuth();
  const [categories, setCategories] = useState([]);
  const [missions, setMissions] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rateDrafts, setRateDrafts] = useState({});

  const [form, setForm] = useState(emptyForm());
  const selectedCategory = categories.find((c) => c.id === form.categoryId);

  async function refresh() {
    try {
      const { missions } = await agencyApi.missionsNouvelleAgence(token);
      setMissions(missions);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => {
    if (!token) return;
    api.categories().then(({ categories }) => setCategories(categories)).catch(() => {});
    refresh();
  }, [token]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      await agencyApi.createAgencyMission({
        categoryId: form.categoryId,
        serviceId: form.serviceId || undefined,
        details: Object.fromEntries(Object.entries(form.details).filter(([, v]) => v !== '' && v != null)),
        title: form.title,
        description: form.description,
        address: form.address,
        estimatedHours: Number(form.estimatedHours),
        desiredDate: form.desiredDate || new Date().toISOString(),
        isUrgent: form.isUrgent,
        datesFlexible: form.datesFlexible,
        workAtHeight: form.workAtHeight ?? undefined,
        isRecurring: form.isRecurring,
        dates: form.isRecurring ? form.dates.map((d) => ({ ...d, hours: Number(d.hours) })) : [],
        requiredEquipmentIds: form.requiredEquipmentIds,
        otherEquipmentNote: form.otherEquipmentChecked ? form.otherEquipmentNote.trim() : '',
        requiredVehicleTypes: form.requiredVehicleTypes,
        otherVehicleNote: form.otherVehicleChecked ? form.otherVehicleNote.trim() : '',
      }, token);
      setMessage('Mission agence créée.');
      setShowForm(false);
      setForm(emptyForm());
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function publish(id) {
    setBusy(true);
    try { await agencyApi.publishToJobber(id, token); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  async function traiterEnAgence(id) {
    const hourlyRate = Number(rateDrafts[id]);
    if (!hourlyRate || hourlyRate <= 0) { setError('Indiquez un tarif horaire valide.'); return; }
    setBusy(true);
    try { await agencyApi.missionAgence(id, { hourlyRate }, token); await refresh(); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Nouvelle mission agence</h1>
      <p className="mt-1 text-sm text-slate-500">Missions créées directement par l'agence — contrats longue durée compris.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {message && <p className="mt-4 rounded-md bg-brand-light px-3 py-2 text-sm text-brand-dark">{message}</p>}

      {showForm && (
        <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <select
            required value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value, serviceId: '', details: {}, requiredEquipmentIds: [] })}
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Catégorie…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

          <MissionExtraFields category={selectedCategory} form={form} setForm={setForm} />

          <input required placeholder="Titre de la mission" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <textarea required placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm" />
          <AddressAutocomplete value={form.address} onChange={(v) => setForm({ ...form, address: v })} required placeholder="Adresse" />

          <div>
            <span className="text-xs font-medium text-slate-500">Fréquence</span>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, isRecurring: false })} className={`rounded-lg border-2 py-3 text-sm font-semibold uppercase ${!form.isRecurring ? 'border-brand bg-brand text-white' : 'border-slate-200 text-slate-500'}`}>
                Ponctuel
              </button>
              <button type="button" onClick={() => setForm({ ...form, isRecurring: true })} className={`rounded-lg border-2 py-3 text-sm font-semibold uppercase ${form.isRecurring ? 'border-brand bg-brand text-white' : 'border-slate-200 text-slate-500'}`}>
                Récurrent
              </button>
            </div>
          </div>

          {form.isRecurring ? (
            <RecurringDatesEditor dates={form.dates} onChange={(dates) => setForm({ ...form, dates })} />
          ) : (
            <div className="flex gap-3">
              <input type="datetime-local" required value={form.desiredDate} onChange={(e) => setForm({ ...form, desiredDate: e.target.value })} className="rounded-md border border-slate-200 px-3 py-2 text-sm" />
              <input type="number" min={0.5} step={0.5} required value={form.estimatedHours} onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })} placeholder="Heures" className="w-28 rounded-md border border-slate-200 px-3 py-2 text-sm" />
            </div>
          )}

          <div>
            <span className="text-xs font-medium text-slate-500">Options (cumulables)</span>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isUrgent: !f.isUrgent }))}
                className={`rounded-lg border-2 py-3 text-center text-sm font-bold uppercase tracking-wide transition ${
                  form.isUrgent ? 'border-clay bg-clay text-white' : 'border-slate-200 text-slate-500 hover:border-clay hover:text-clay'
                }`}
              >
                Urgent
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, datesFlexible: !f.datesFlexible }))}
                className={`rounded-lg border-2 py-3 text-center text-sm font-bold uppercase tracking-wide transition ${
                  form.datesFlexible ? 'border-green-600 bg-green-600 text-white' : 'border-slate-200 text-slate-500 hover:border-green-600 hover:text-green-600'
                }`}
              >
                Dates flexibles
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
              {busy ? 'Création…' : 'Créer la mission'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-400 hover:text-ink">Annuler</button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {missions === null && <p className="text-sm text-slate-400">Chargement…</p>}
        {missions?.length === 0 && !showForm && <p className="text-sm text-slate-400">Aucune mission agence créée pour l'instant.</p>}
        {missions?.map((m) => (
          <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{m.category?.icon}</span>
              <span className="font-display text-base font-semibold text-ink">{m.title}</span>
              {m.corporateCode && <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-mono font-semibold text-brand-dark">{m.corporateCode}</span>}
              {m.isRecurring && <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent-dark">Récurrent · {m.scheduleEntries?.length || 0} date(s)</span>}
            </div>
            <div className="mt-1 text-sm text-slate-500">{m.address} · {m.estimatedHours} h · {m.visibility === 'PUBLIC' ? 'Publiée sur Jobber' : 'Non publiée'}</div>

            {m.visibility !== 'PUBLIC' && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                <button type="button" disabled={busy} onClick={() => publish(m.id)} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60">
                  Publier sur Jobber
                </button>
                <span className="text-xs text-slate-400">ou</span>
                <input type="number" min={5} placeholder="Tarif €/h" value={rateDrafts[m.id] || ''} onChange={(e) => setRateDrafts((d) => ({ ...d, [m.id]: e.target.value }))} className="w-28 rounded-md border border-slate-200 px-2 py-2 text-sm" />
                <button type="button" disabled={busy} onClick={() => traiterEnAgence(m.id)} className="rounded-md border border-brand px-4 py-2 text-sm font-medium text-brand hover:bg-brand-light disabled:opacity-60">
                  Traité en agence
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {!showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="fixed bottom-8 right-8 flex items-center gap-2 rounded-full bg-brand px-6 py-4 font-display text-base font-bold text-white shadow-lg hover:bg-brand-dark"
        >
          <span className="text-xl leading-none">+</span> Créer une mission agence
        </button>
      )}
    </div>
  );
}
