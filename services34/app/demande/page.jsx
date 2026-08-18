'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import VehicleIcon, { VEHICLES } from '../../components/VehicleIcon';
import { WORK_AT_HEIGHT_EQUIPMENT_NAMES } from '../../lib/workAtHeightEquipment';

const ALLOWED_SLUGS = ['bricolage', 'menage', 'jardinage', 'piscine', 'conciergerie'];

const STEPS = [
  { key: 'details', label: 'Détails' },
  { key: 'lieu', label: 'Lieu' },
  { key: 'planning', label: 'Planning' },
  { key: 'recap', label: 'Récapitulatif' },
];

// A visitor filling this (often long) form must never lose their work just
// because sending the request requires an account — the whole draft is
// mirrored to sessionStorage on every change and restored on mount, so
// bouncing through register/login and back (via ?next=/demande, already
// supported by both auth pages) loses nothing. Cleared once actually sent.
const DRAFT_KEY = 'services34:demandeDraft';

function loadDraft() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; }
}

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
    </svg>
  );
}

function StepIndicator({ step, canReach, onStepClick }) {
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <button
            type="button"
            disabled={!canReach(i)}
            onClick={() => onStepClick(i)}
            className="flex flex-col items-center gap-1.5 disabled:cursor-not-allowed"
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                i < step ? 'bg-brand text-white' : i === step ? 'bg-brand text-white ring-4 ring-accent-light' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i < step ? <CheckIcon className="h-4 w-4" /> : i + 1}
            </span>
            <span className={`hidden text-xs font-medium sm:block ${i <= step ? 'text-ink' : 'text-slate-400'}`}>{s.label}</span>
          </button>
          {i < STEPS.length - 1 && <div className={`mx-2 h-0.5 w-6 sm:w-12 ${i < step ? 'bg-brand' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );
}

function Block({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      {title && (
        <div className="mb-4">
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export default function DemandePage() {
  return (
    <Suspense fallback={null}>
      <DemandeForm />
    </Suspense>
  );
}

function DemandeForm() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [step, setStep] = useState(() => loadDraft()?.step ?? 0);
  const [form, setForm] = useState(() => ({
    categoryId: '', serviceId: '', details: {},
    title: '', description: '', address: '',
    desiredDate: '', desiredTime: '10:00', estimatedHours: 2,
    isUrgent: false, datesFlexible: false, workAtHeight: null,
    recurrenceType: 'PONCTUEL', recurrenceCount: 1, recurrenceUnit: 'SEMAINE',
    requiredEquipmentIds: [], otherEquipmentChecked: false, otherEquipmentNote: '',
    requiredVehicleTypes: [], otherVehicleChecked: false, otherVehicleNote: '',
    accessInstructions: '', parkingDifficulty: '', accessType: '', numberOfPeople: 1,
    ...(loadDraft()?.form || {}),
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.categories().then(({ categories }) => {
      setCategories(categories.filter((c) => ALLOWED_SLUGS.includes(c.slug)));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step })); } catch {}
  }, [form, step]);

  // Arriving from a category page's own "Demander une intervention" button
  // (?categorie=jardinage) pre-selects that category so the visitor only
  // has to refine the prestation, instead of picking the category again.
  useEffect(() => {
    if (form.categoryId || categories.length === 0) return;
    const slug = searchParams.get('categorie');
    const match = slug && categories.find((c) => c.slug === slug);
    if (match) setForm((f) => ({ ...f, categoryId: match.id }));
  }, [categories, searchParams]);

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

  function stepComplete(i) {
    if (i === 0) return !!(form.categoryId && form.title.trim() && form.description.trim());
    if (i === 1) return !!form.address;
    if (i === 2) return !!(form.desiredDate && form.desiredTime && form.estimatedHours);
    return true;
  }
  function canReach(i) {
    for (let j = 0; j < i; j++) if (!stepComplete(j)) return false;
    return true;
  }
  function goNext() {
    if (!stepComplete(step)) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  const registerUrl = '/auth/register?next=/demande';

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (!user) {
      router.push(registerUrl);
      return;
    }
    if (!stepComplete(0) || !stepComplete(1) || !stepComplete(2)) { setError('Merci de compléter toutes les étapes précédentes.'); return; }

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
          accessInstructions: form.accessInstructions.trim(),
          parkingDifficulty: form.parkingDifficulty || undefined,
          accessType: form.accessType || undefined,
          numberOfPeople: Number(form.numberOfPeople) || 1,
        },
        token
      );
      try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
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
    <div className="mx-auto max-w-6xl">
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
          <a href={registerUrl} className="mt-2 inline-block font-medium underline">
            Créer mon compte gratuit
          </a>
          <span> — vous ne perdrez pas votre saisie.</span>
        </div>
      )}

      <div className="mt-6">
        <StepIndicator step={step} onStepClick={(i) => canReach(i) && setStep(i)} canReach={canReach} />
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {step === 0 && (
            <>
              <Block title="1. Détails de la demande" subtitle="Commencez par décrire précisément votre besoin.">
                <div className="space-y-4">
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
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
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
                </div>
              </Block>

              <Block title="Options">
                <div className="space-y-4">
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
                </div>
              </Block>

              {selectedCategory?.equipment?.length > 0 && (
                <Block title="Matériel" subtitle="Cochez le matériel que l'agent doit avoir avec lui.">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
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
                </Block>
              )}

              <Block title="Véhicule requis" subtitle="Cochez le ou les véhicules requis pour cette intervention.">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {VEHICLES.map((v) => {
                    const active = form.requiredVehicleTypes.includes(v.type);
                    return (
                      <button
                        key={v.type}
                        type="button"
                        onClick={() => toggleRequiredVehicle(v.type)}
                        className={`flex flex-col items-center rounded-lg border-2 p-3 text-center ${active ? 'border-brand bg-accent-light' : 'border-slate-200 bg-white'}`}
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
              </Block>

              {showWorkAtHeight && (
                <Block title="Travail en hauteur prévu ?">
                  <div className="grid grid-cols-2 gap-3">
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
                </Block>
              )}

              <Block title="Nombre de personnes">
                <label className="block max-w-[160px]">
                  <span className="text-xs font-medium text-slate-500">Agents attendus sur l'intervention</span>
                  <select
                    value={form.numberOfPeople}
                    onChange={(e) => setForm((f) => ({ ...f, numberOfPeople: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n} personne{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </label>
              </Block>
            </>
          )}

          {step === 1 && (
            <Block title="2. Lieu de l'intervention" subtitle="Indiquez l'adresse précise où l'intervention doit être réalisée.">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Adresse</span>
                  <AddressAutocomplete value={form.address} onChange={(v) => setForm({ ...form, address: v })} required />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Instructions d'accès (facultatif)</span>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={form.accessInstructions}
                    onChange={(e) => setForm({ ...form, accessInstructions: e.target.value })}
                    placeholder="Ex : Code porte 1234A - Appartement au 2ème étage à gauche"
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <span className="mt-1 flex items-center justify-between text-xs text-slate-400">
                    <span>Visible uniquement par l'agent une fois affecté.</span>
                    <span>{form.accessInstructions.length}/500</span>
                  </span>
                </label>

                <div>
                  <span className="text-xs font-medium text-slate-500">Stationnement</span>
                  <div className="mt-2 grid grid-cols-3 gap-3">
                    {[
                      ['FACILE', 'Facile', 'Places disponibles à proximité'],
                      ['PAYANT', 'Payant', 'Parking payant à proximité'],
                      ['DIFFICILE', 'Difficile', 'Peu ou pas de places'],
                    ].map(([value, label, hint]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, parkingDifficulty: f.parkingDifficulty === value ? '' : value }))}
                        className={`rounded-lg border-2 p-3 text-left transition ${
                          form.parkingDifficulty === value ? 'border-brand bg-accent-light' : 'border-slate-200 hover:border-brand'
                        }`}
                      >
                        <span className="block text-sm font-semibold text-ink">{label}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-slate-500">Type d'accès</span>
                  <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      ['PLAIN_PIED', 'Plain-pied'],
                      ['ESCALIERS', 'Escaliers'],
                      ['ASCENSEUR', 'Ascenseur'],
                      ['AUTRE', 'Autre'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, accessType: f.accessType === value ? '' : value }))}
                        className={`rounded-lg border-2 py-2.5 text-center text-sm font-semibold transition ${
                          form.accessType === value ? 'border-brand bg-brand text-white' : 'border-slate-200 text-slate-500 hover:border-brand hover:text-brand'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Block>
          )}

          {step === 2 && (
            <Block title="3. Planning" subtitle="Quand l'intervention doit-elle avoir lieu ?">
              <div className="space-y-4">
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
              </div>
            </Block>
          )}

          {step === 3 && (
            <Block title="4. Récapitulatif" subtitle="Vérifiez les informations avant d'envoyer.">
              <dl className="space-y-3 text-sm">
                <RecapRow label="Service" value={selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : '—'} />
                <RecapRow label="Titre" value={form.title || '—'} />
                <RecapRow label="Description" value={form.description || '—'} multiline />
                <RecapRow label="Adresse" value={form.address || '—'} />
                {form.accessInstructions && <RecapRow label="Instructions d'accès" value={form.accessInstructions} multiline />}
                {form.parkingDifficulty && <RecapRow label="Stationnement" value={{ FACILE: 'Facile', PAYANT: 'Payant', DIFFICILE: 'Difficile' }[form.parkingDifficulty]} />}
                {form.accessType && <RecapRow label="Type d'accès" value={{ PLAIN_PIED: 'Plain-pied', ESCALIERS: 'Escaliers', ASCENSEUR: 'Ascenseur', AUTRE: 'Autre' }[form.accessType]} />}
                <RecapRow label="Nombre de personnes" value={`${form.numberOfPeople}`} />
                <RecapRow label="Date" value={form.desiredDate ? `${form.desiredDate} à ${form.desiredTime}` : '—'} />
                <RecapRow label="Durée estimée" value={`${form.estimatedHours} h`} />
                <RecapRow
                  label="Options"
                  value={[form.isUrgent && 'Urgent', form.datesFlexible && 'Dates flexibles', form.recurrenceType === 'RECURRENT' && 'Récurrent'].filter(Boolean).join(', ') || 'Aucune'}
                />
              </dl>

              {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

              <button
                disabled={loading}
                className="mt-5 w-full rounded-full bg-brand py-3.5 font-display text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
              >
                {loading ? 'Envoi…' : user ? 'Envoyer ma demande' : 'Continuer'}
              </button>
            </Block>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              className={`rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:border-brand ${step === 0 ? 'invisible' : ''}`}
            >
              ← Étape précédente
            </button>
            {step < STEPS.length - 1 && (
              <button
                type="button"
                onClick={goNext}
                disabled={!stepComplete(step)}
                className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-40"
              >
                Étape suivante →
              </button>
            )}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-6">
            <DemandePreview form={form} selectedCategory={selectedCategory} />
          </div>
        </div>
      </form>
    </div>
  );
}

function RecapRow({ label, value, multiline }) {
  return (
    <div className={multiline ? '' : 'flex items-start justify-between gap-4'}>
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <dd className={`text-ink ${multiline ? 'mt-1' : 'text-right'}`}>{value}</dd>
    </div>
  );
}

function DemandePreview({ form, selectedCategory }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span>👁️</span> Aperçu de votre demande
      </div>
      <p className="mt-1 text-xs text-slate-400">Voici ce que verra l'agence.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : 'Service'}
        </span>
        {form.isUrgent && <span className="rounded-full bg-clay px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Urgent</span>}
        {form.datesFlexible && <span className="rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Dates flexibles</span>}
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold text-ink">{form.title || 'Titre de la demande'}</h3>
      <p className="mt-1.5 line-clamp-3 text-sm text-slate-500">{form.description || 'La description apparaîtra ici.'}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-400">Durée estimée</div>
          <div className="mt-0.5 font-display text-base font-bold text-ink">{form.estimatedHours || '—'} h</div>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="text-xs text-slate-400">Personnes</div>
          <div className="mt-0.5 font-display text-base font-bold text-ink">{form.numberOfPeople}</div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-400">Adresse</div>
        <div className="mt-0.5 text-sm font-medium text-ink">{form.address || 'À renseigner'}</div>
      </div>

      {form.desiredDate && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-400">Date souhaitée</div>
          <div className="mt-0.5 text-sm font-medium text-ink">
            {new Date(`${form.desiredDate}T${form.desiredTime || '00:00'}`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {form.desiredTime}
          </div>
        </div>
      )}
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
