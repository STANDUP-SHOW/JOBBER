'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import VehicleIcon, { VEHICLES } from '../../components/VehicleIcon';
import { WORK_AT_HEIGHT_EQUIPMENT_NAMES } from '../../lib/workAtHeightEquipment';

const ALLOWED_SLUGS = ['bricolage', 'menage', 'jardinage', 'piscine', 'conciergerie'];

export default function DemandePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: '', serviceId: '', details: {},
    title: '', description: '', address: '',
    desiredDate: '', desiredTime: '10:00', estimatedHours: 2,
    isUrgent: false, datesFlexible: false, workAtHeight: null,
    recurrenceType: 'PONCTUEL', recurrenceCount: 1, recurrenceUnit: 'SEMAINE',
    requiredEquipmentIds: [], otherEquipmentChecked: false, otherEquipmentNote: '',
    requiredVehicleTypes: [], otherVehicleChecked: false, otherVehicleNote: '',
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
  const selectedService = selectedCategory?.services?.find((s) => s.id === form.serviceId);
  const detailFields = selectedService?.detailFields || [];
  const showWorkAtHeight = selectedCategory?.equipment?.some(
    (eq) => WORK_AT_HEIGHT_EQUIPMENT_NAMES.includes(eq.name) && form.requiredEquipmentIds.includes(eq.id)
  );

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
      const isRecurring = form.recurrenceType === 'RECURRENT';

      await api.createMission(
        {
          categoryId: form.categoryId,
          serviceId: form.serviceId || undefined,
          details: Object.fromEntries(Object.entries(form.details).filter(([, v]) => v !== '' && v != null)),
          title: form.title,
          description: form.description,
          address: form.address,
          desiredDate: desiredDateTime,
          estimatedHours: Number(form.estimatedHours),
          isUrgent: form.isUrgent,
          datesFlexible: form.datesFlexible,
          workAtHeight: form.workAtHeight ?? undefined,
          isRecurring,
          recurrenceCount: isRecurring ? Number(form.recurrenceCount) : undefined,
          recurrenceUnit: isRecurring ? form.recurrenceUnit : undefined,
          requiredEquipmentIds: form.requiredEquipmentIds,
          otherEquipmentNote: form.otherEquipmentChecked ? form.otherEquipmentNote.trim() : '',
          requiredVehicleTypes: form.requiredVehicleTypes,
          otherVehicleNote: form.otherVehicleChecked ? form.otherVehicleNote.trim() : '',
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
        <div className="mt-4 rounded-md bg-accent-light px-5 py-4 text-sm text-accent-dark">
          <p className="font-semibold">Pourquoi créer votre compte ?</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Suivre votre demande</li>
            <li>Recevoir votre offre de prestation</li>
            <li>Mettre en place, gérer et consulter votre planning d'interventions</li>
            <li>Laisser un avis sur le service reçu</li>
            <li>Communiquer avec l'agence</li>
            <li>Consulter l'heure d'arrivée exacte de votre agent, une fois sa géolocalisation activée</li>
          </ul>
          <p className="mt-3 font-medium">
            Le compte est totalement gratuit — on ne vous demandera jamais de vous abonner.
          </p>
          <a href="/auth/register?next=/demande" className="mt-2 inline-block font-medium underline">
            Créer mon compte gratuit
          </a>
          <span> — vous ne perdrez pas votre saisie.</span>
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-slate-500">Service</span>
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value, serviceId: '', details: {}, requiredEquipmentIds: [] })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Choisir…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </label>

        {selectedCategory?.services?.length > 0 && (
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Prestation précise (optionnel)</span>
            <select
              value={form.serviceId}
              onChange={(e) => setForm({ ...form, serviceId: e.target.value, details: {} })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
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
                <DetailField
                  key={field.key}
                  field={field}
                  value={form.details[field.key]}
                  onChange={(v) => setDetail(field.key, v)}
                  otherValue={form.details[`${field.key}Precision`]}
                  onOtherChange={(v) => setDetail(`${field.key}Precision`, v)}
                />
              ))}
            </div>
          </div>
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
            type="number" min={0.5} step={0.5} required value={form.estimatedHours}
            onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>

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
                form.recurrenceType === 'PONCTUEL' ? 'border-brand bg-brand text-white' : 'border-slate-200 text-slate-500 hover:border-brand hover:text-brand'
              }`}
            >
              Ponctuel
            </button>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, recurrenceType: 'RECURRENT' }))}
              className={`rounded-lg border-2 py-4 text-center font-display text-base font-bold uppercase tracking-wide transition ${
                form.recurrenceType === 'RECURRENT' ? 'border-brand bg-brand text-white' : 'border-slate-200 text-slate-500 hover:border-brand hover:text-brand'
              }`}
            >
              Récurrent
            </button>
          </div>
          {form.recurrenceType === 'RECURRENT' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-ink">
              <span>Intervention à réaliser</span>
              <select
                value={form.recurrenceCount}
                onChange={(e) => setForm((f) => ({ ...f, recurrenceCount: e.target.value }))}
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span>fois par</span>
              <select
                value={form.recurrenceUnit}
                onChange={(e) => setForm((f) => ({ ...f, recurrenceUnit: e.target.value }))}
                className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand"
              >
                <option value="JOUR">jour</option>
                <option value="SEMAINE">semaine</option>
                <option value="MOIS">mois</option>
                <option value="AN">an</option>
              </select>
            </div>
          )}
        </div>

        {selectedCategory?.equipment?.length > 0 && (
          <div>
            <span className="text-sm font-semibold text-ink">L'agent doit-il apporter du matériel ?</span>
            <p className="mt-1 text-sm text-slate-500">Cochez le matériel que l'agent doit avoir avec lui.</p>
            <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
              {selectedCategory.equipment.map((eq) => (
                <label key={eq.id} className="flex items-center gap-2.5 text-base text-ink">
                  <input
                    type="checkbox"
                    checked={form.requiredEquipmentIds.includes(eq.id)}
                    onChange={() => toggleRequiredEquipment(eq.id)}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
                  />
                  {eq.name}
                </label>
              ))}
              <label className="flex items-center gap-2.5 text-base text-ink">
                <input
                  type="checkbox"
                  checked={form.otherEquipmentChecked}
                  onChange={(e) => setForm((f) => ({ ...f, otherEquipmentChecked: e.target.checked }))}
                  className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
                />
                Autre
              </label>
            </div>
            {form.otherEquipmentChecked && (
              <div className="mt-2">
                <input
                  type="text" maxLength={200} value={form.otherEquipmentNote}
                  onChange={(e) => setForm((f) => ({ ...f, otherEquipmentNote: e.target.value }))}
                  placeholder="Précisez le matériel nécessaire…"
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
            )}
          </div>
        )}

        <div>
          <span className="text-sm font-semibold text-ink">L'agent doit-il être équipé d'un véhicule spécial ?</span>
          <p className="mt-1 text-sm text-slate-500">Cochez le ou les véhicules requis pour cette intervention.</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {VEHICLES.map((v) => {
              const active = form.requiredVehicleTypes.includes(v.type);
              return (
                <button
                  key={v.type}
                  type="button"
                  onClick={() => toggleRequiredVehicle(v.type)}
                  className={`flex flex-col items-center rounded-lg border-2 p-3 text-center ${active ? 'border-brand bg-brand-light' : 'border-slate-200 bg-white'}`}
                >
                  <VehicleIcon type={v.type} className={`h-9 w-14 ${active ? '' : 'opacity-60'}`} />
                  <span className={`mt-1.5 text-sm font-semibold ${active ? 'text-brand' : 'text-ink'}`}>{v.label}</span>
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
              className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
            />
            Autre véhicule
          </label>
          {form.otherVehicleChecked && (
            <div className="mt-2">
              <input
                type="text" maxLength={200} value={form.otherVehicleNote}
                onChange={(e) => setForm((f) => ({ ...f, otherVehicleNote: e.target.value }))}
                placeholder="Précisez le véhicule nécessaire…"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
              />
            </div>
          )}
        </div>

        {showWorkAtHeight && (
          <div>
            <span className="text-sm font-semibold text-ink">Travail en hauteur prévu ?</span>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, workAtHeight: true }))}
                className={`rounded-lg border-2 py-4 text-center font-display text-base font-bold uppercase tracking-wide transition ${
                  form.workAtHeight === true ? 'border-clay bg-clay text-white' : 'border-slate-200 text-slate-500 hover:border-clay hover:text-clay'
                }`}
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, workAtHeight: false }))}
                className={`rounded-lg border-2 py-4 text-center font-display text-base font-bold uppercase tracking-wide transition ${
                  form.workAtHeight === false ? 'border-brand bg-brand text-white' : 'border-slate-200 text-slate-500 hover:border-brand hover:text-brand'
                }`}
              >
                Non
              </button>
            </div>
          </div>
        )}

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button disabled={loading} className="w-full rounded-md bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60">
          {loading ? 'Envoi…' : user ? 'Envoyer ma demande' : 'Continuer'}
        </button>
      </form>
    </div>
  );
}

function DetailField({ field, value, onChange, otherValue, onOtherChange }) {
  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-2.5 text-sm text-ink">
        <input
          type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
        />
        {field.label}
      </label>
    );
  }

  if (field.type === 'multiselect') {
    const selected = Array.isArray(value) ? value : [];
    function toggle(opt) {
      onChange(selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt]);
    }
    const groups = field.groups || [{ title: null, options: field.options || [] }];
    return (
      <div className="sm:col-span-2">
        <span className="text-xs font-medium text-slate-500">{field.label}</span>
        <div className="mt-2 space-y-4">
          {groups.map((group) => (
            <div key={group.title || 'default'}>
              {group.title && <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brand">{group.title}</div>}
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {group.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 accent-brand"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label className="block">
          <span className="text-xs font-medium text-slate-500">{field.label}</span>
          <select
            value={value ?? ''} onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          >
            <option value="">Choisir…</option>
            {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
        {field.other && value === 'Autre' && (
          <label className="mt-2 block">
            <span className="text-xs font-medium text-slate-500">Précisez</span>
            <input
              type="text" value={otherValue ?? ''} onChange={(e) => onOtherChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
        )}
      </div>
    );
  }

  return (
    <label className="block">
      <span className="text-xs font-medium text-slate-500">{field.label}{field.unit ? ` (${field.unit})` : ''}</span>
      <input
        type={field.type === 'number' ? 'number' : 'text'} step={field.type === 'number' ? 'any' : undefined}
        value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
      />
    </label>
  );
}
