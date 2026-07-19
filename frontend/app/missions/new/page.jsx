'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import MissionPhotosUpload from '../../../components/MissionPhotosUpload';
import AddressAutocomplete from '../../../components/AddressAutocomplete';
import VehicleIcon, { VEHICLES } from '../../../components/VehicleIcon';

const TRANSPORT_CATEGORY_SLUGS = ['convoi', 'demenagement', 'transport'];

export default function NewMissionPage() {
  return (
    <Suspense fallback={<p className="text-slate-400">Chargement…</p>}>
      <NewMissionForm />
    </Suspense>
  );
}

function NewMissionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, loading: authLoading } = useAuth();

  const isLessonMode = searchParams.get('type') === 'lesson';
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: searchParams.get('categoryId') || '',
    serviceId: '',
    details: {},
    title: '',
    description: '',
    address: '',
    dropoffAddress: '',
    desiredDate: '',
    desiredTime: '09:00',
    estimatedHours: 2,
    photos: [],
    isUrgent: false,
    datesFlexible: false,
    recurrenceType: 'PONCTUEL',
    recurrenceCount: 1,
    recurrenceUnit: 'SEMAINE',
    requiredEquipmentIds: [],
    otherEquipmentChecked: false,
    otherEquipmentNote: '',
    requiredVehicleTypes: [],
    otherVehicleChecked: false,
    otherVehicleNote: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.categories().then(({ categories }) => setCategories(categories)).catch(() => {});
  }, []);

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const isTransportMission = selectedCategory && TRANSPORT_CATEGORY_SLUGS.includes(selectedCategory.slug);
  const selectedService = selectedCategory?.services?.find((s) => s.id === form.serviceId);
  const detailFields = selectedService?.detailFields || [];

  function setDetail(key, value) {
    setForm((f) => ({ ...f, details: { ...f.details, [key]: value } }));
  }

  function toggleRequiredEquipment(equipmentId) {
    setForm((f) => ({
      ...f,
      requiredEquipmentIds: f.requiredEquipmentIds.includes(equipmentId)
        ? f.requiredEquipmentIds.filter((id) => id !== equipmentId)
        : [...f.requiredEquipmentIds, equipmentId],
    }));
  }

  function toggleRequiredVehicle(type) {
    setForm((f) => ({
      ...f,
      requiredVehicleTypes: f.requiredVehicleTypes.includes(type)
        ? f.requiredVehicleTypes.filter((t) => t !== type)
        : [...f.requiredVehicleTypes, type],
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!user) { router.push('/auth/login'); return; }
    setError('');
    setLoading(true);
    try {
      const { desiredTime, otherEquipmentChecked, otherVehicleChecked, recurrenceType, ...rest } = form;
      const isRecurring = recurrenceType === 'RECURRENT';
      // Combine as local wall-clock time before converting to an
      // unambiguous ISO string, so the stored instant matches what the
      // user actually picked regardless of server timezone.
      const [year, month, day] = form.desiredDate.split('-').map(Number);
      const [hour, minute] = desiredTime.split(':').map(Number);
      const desiredDateTime = new Date(year, month - 1, day, hour, minute).toISOString();

      const { mission } = await api.createMission(
        {
          ...rest,
          desiredDate: desiredDateTime,
          estimatedHours: Number(form.estimatedHours),
          otherEquipmentNote: otherEquipmentChecked ? form.otherEquipmentNote.trim() : '',
          otherVehicleNote: otherVehicleChecked ? form.otherVehicleNote.trim() : '',
          details: Object.fromEntries(Object.entries(form.details).filter(([, v]) => v !== '' && v != null)),
          type: isLessonMode ? 'LESSON' : 'TASK',
          isRecurring,
          recurrenceCount: isRecurring ? Number(form.recurrenceCount) : undefined,
          recurrenceUnit: isRecurring ? form.recurrenceUnit : undefined,
        },
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
      <span className="label-eyebrow text-moss">{isLessonMode ? 'Demander un cours' : 'Publier un besoin'}</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        {isLessonMode ? 'Décrivez le cours que vous recherchez' : 'Décrivez votre mission'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {isLessonMode
          ? 'Un jobber qui propose des cours dans cette catégorie viendra vous apprendre chez vous.'
          : 'Les prestataires disponibles pourront vous proposer leur tarif horaire.'}
      </p>

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
            onChange={(e) => setForm({ ...form, categoryId: e.target.value, serviceId: '', requiredEquipmentIds: [] })}
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
              onChange={(e) => setForm({ ...form, serviceId: e.target.value, details: {} })}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
            >
              <option value="">Non précisé</option>
              {selectedCategory.services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        )}

        {detailFields.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <span className="text-sm font-semibold text-ink">Précisions sur « {selectedService.name} »</span>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {detailFields.map((field) => (
                <DetailField key={field.key} field={field} value={form.details[field.key]} onChange={(v) => setDetail(field.key, v)} />
              ))}
            </div>
          </div>
        )}

        <Field
          label="Titre"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
          required
          placeholder={isLessonMode ? 'Ex : Cours de jardinage pour débutant' : 'Ex : Montage de meubles de cuisine'}
        />
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Description</span>
          <textarea
            required rows={4} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            placeholder={isLessonMode ? 'Décrivez ce que vous souhaitez apprendre et votre niveau actuel…' : 'Détaillez la tâche, le matériel disponible, l\'accès au logement…'}
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">{isTransportMission ? 'Adresse de départ' : 'Adresse'}</span>
          <AddressAutocomplete
            value={form.address}
            onChange={(v) => setForm({ ...form, address: v })}
            required
            placeholder="Rue, ville"
          />
        </label>

        {isTransportMission && (
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Adresse d'arrivée</span>
            <AddressAutocomplete
              value={form.dropoffAddress}
              onChange={(v) => setForm({ ...form, dropoffAddress: v })}
              required
              placeholder="Rue, ville"
            />
          </label>
        )}

        <div>
          <span className="text-xs font-medium text-slate-500">Photos (optionnel, jusqu'à 5)</span>
          <div className="mt-1">
            <MissionPhotosUpload photos={form.photos} onChange={(photos) => setForm({ ...form, photos })} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date souhaitée" type="date" value={form.desiredDate} onChange={(v) => setForm({ ...form, desiredDate: v })} required />
          <Field label="Heure de début" type="time" value={form.desiredTime} onChange={(v) => setForm({ ...form, desiredTime: v })} required />
        </div>
        <Field label="Durée estimée (heures)" type="number" min="0.5" step="0.5" value={form.estimatedHours} onChange={(v) => setForm({ ...form, estimatedHours: v })} required />

        <div>
          <span className="text-xs font-medium text-slate-500">Options (cumulables)</span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isUrgent: !f.isUrgent }))}
              className={`rounded-lg border-2 py-4 text-center font-display text-base font-bold uppercase tracking-wide transition ${
                form.isUrgent ? 'border-clay bg-clay text-white' : 'border-slate-200 text-slate-500 hover:border-clay hover:text-clay'
              }`}
            >
              Urgent
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, datesFlexible: !f.datesFlexible }))}
              className={`rounded-lg border-2 py-4 text-center font-display text-base font-bold uppercase tracking-wide transition ${
                form.datesFlexible ? 'border-green-600 bg-green-600 text-white' : 'border-slate-200 text-slate-500 hover:border-green-600 hover:text-green-600'
              }`}
            >
              Dates flexibles
            </button>
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500">Fréquence</span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, recurrenceType: 'PONCTUEL' }))}
              className={`rounded-lg border-2 py-4 text-center font-display text-base font-bold uppercase tracking-wide transition ${
                form.recurrenceType === 'PONCTUEL' ? 'border-moss bg-moss text-white' : 'border-slate-200 text-slate-500 hover:border-moss hover:text-moss'
              }`}
            >
              Ponctuel
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, recurrenceType: 'RECURRENT' }))}
              className={`rounded-lg border-2 py-4 text-center font-display text-base font-bold uppercase tracking-wide transition ${
                form.recurrenceType === 'RECURRENT' ? 'border-moss bg-moss text-white' : 'border-slate-200 text-slate-500 hover:border-moss hover:text-moss'
              }`}
            >
              Récurrent
            </button>
          </div>
          {form.recurrenceType === 'RECURRENT' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink">
              <span>Mission à réaliser</span>
              <select
                value={form.recurrenceCount}
                onChange={(e) => setForm((f) => ({ ...f, recurrenceCount: e.target.value }))}
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-moss"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span>fois par</span>
              <select
                value={form.recurrenceUnit}
                onChange={(e) => setForm((f) => ({ ...f, recurrenceUnit: e.target.value }))}
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-moss"
              >
                <option value="JOUR">jour</option>
                <option value="SEMAINE">semaine</option>
                <option value="MOIS">mois</option>
                <option value="AN">an</option>
              </select>
            </div>
          )}
        </div>

        {!isLessonMode && selectedCategory?.equipment?.length > 0 && (
          <div>
            <span className="text-sm font-semibold text-ink">Le jobber doit-il apporter du matériel ?</span>
            <p className="mt-1 text-sm text-slate-500">Cochez le matériel que le prestataire doit avoir avec lui.</p>
            <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
              {selectedCategory.equipment.map((eq) => (
                <label key={eq.id} className="flex items-center gap-2.5 text-base text-ink">
                  <input
                    type="checkbox"
                    checked={form.requiredEquipmentIds.includes(eq.id)}
                    onChange={() => toggleRequiredEquipment(eq.id)}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
                  />
                  {eq.name}
                </label>
              ))}
              <label className="flex items-center gap-2.5 text-base text-ink">
                <input
                  type="checkbox"
                  checked={form.otherEquipmentChecked}
                  onChange={(e) => setForm((f) => ({ ...f, otherEquipmentChecked: e.target.checked }))}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
                />
                Autre
              </label>
            </div>
            {form.otherEquipmentChecked && (
              <div className="mt-2">
                <input
                  type="text"
                  maxLength={200}
                  value={form.otherEquipmentNote}
                  onChange={(e) => setForm((f) => ({ ...f, otherEquipmentNote: e.target.value }))}
                  placeholder="Précisez le matériel nécessaire…"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
                />
                <span className="mt-1 block text-xs text-slate-400">{form.otherEquipmentNote.length}/200</span>
              </div>
            )}
          </div>
        )}

        {!isLessonMode && (
        <div>
          <span className="text-sm font-semibold text-ink">Le jobber doit-il être équipé d'un véhicule spécial ?</span>
          <p className="mt-1 text-sm text-slate-500">Cochez le ou les véhicules requis pour cette mission.</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VEHICLES.map((v) => {
              const active = form.requiredVehicleTypes.includes(v.type);
              return (
                <button
                  key={v.type}
                  type="button"
                  onClick={() => toggleRequiredVehicle(v.type)}
                  className={`flex flex-col items-center rounded-lg border-2 p-3 text-center ${
                    active ? 'border-moss bg-moss-light' : 'border-slate-200 bg-white'
                  }`}
                >
                  <VehicleIcon type={v.type} className={`h-9 w-14 ${active ? 'text-moss-dark' : 'text-slate-400'}`} />
                  <span className={`mt-1.5 text-sm font-semibold ${active ? 'text-moss-dark' : 'text-ink'}`}>{v.label}</span>
                  {v.capacity && <span className="text-xs text-slate-400">{v.capacity}</span>}
                </button>
              );
            })}
          </div>
          <label className="mt-3 flex items-center gap-2.5 text-base text-ink">
            <input
              type="checkbox"
              checked={form.otherVehicleChecked}
              onChange={(e) => setForm((f) => ({ ...f, otherVehicleChecked: e.target.checked }))}
              className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
            />
            Autre véhicule
          </label>
          {form.otherVehicleChecked && (
            <div className="mt-2">
              <input
                type="text"
                maxLength={200}
                value={form.otherVehicleNote}
                onChange={(e) => setForm((f) => ({ ...f, otherVehicleNote: e.target.value }))}
                placeholder="Précisez le véhicule nécessaire…"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
              />
              <span className="mt-1 block text-xs text-slate-400">{form.otherVehicleNote.length}/200</span>
            </div>
          )}
        </div>
        )}

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button disabled={loading} className="w-full rounded-md bg-moss py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
          {loading ? 'Publication…' : isLessonMode ? 'Publier la demande de cours' : 'Publier la mission'}
        </button>
      </form>
    </div>
  );
}

function DetailField({ field, value, onChange }) {
  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
        />
        {field.label}
      </label>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="block">
        <span className="text-xs font-medium text-slate-500">{field.label}</span>
        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
        >
          <option value="">Choisir…</option>
          {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </label>
    );
  }

  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{field.label}{field.unit ? ` (${field.unit})` : ''}</span>
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        step={field.type === 'number' ? 'any' : undefined}
        value={value ?? ''}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
      />
    </label>
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
