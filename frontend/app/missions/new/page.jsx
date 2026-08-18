'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import MissionPhotosUpload from '../../../components/MissionPhotosUpload';
import AddressAutocomplete from '../../../components/AddressAutocomplete';
import VehicleIcon, { VEHICLES } from '../../../components/VehicleIcon';
import { WORK_AT_HEIGHT_EQUIPMENT_NAMES } from '../../../lib/workAtHeightEquipment';
import { BADGE_CATALOG, REQUIRABLE_BADGES, BADGE_CATEGORY_LABELS } from '../../../lib/badgeCatalog';

const TRANSPORT_CATEGORY_SLUGS = ['convoi', 'demenagement', 'transport'];
// Categories where the jobber accompanies a person (courses, rendez-vous,
// sorties…) rather than hauling cargo — only a passenger vehicle is ever
// relevant, so the full 10-type cargo list (camion benne, remorque…) would
// just be noise. "Autre véhicule" below still covers anything unusual.
const SIMPLE_VEHICLE_CATEGORY_SLUGS = ['aide-personne'];
const SIMPLE_VEHICLE_TYPES = ['VOITURE_TOURISME', 'MINIBUS'];

// Company-only mission options.
const PPE_LIST = [
  'Casque de protection', 'Gants de protection', 'Chaussures de sécurité', 'Lunettes de protection',
  'Gilet haute visibilité', 'Protection auditive', 'Masque de protection respiratoire',
  'Genouillères', 'Harnais de sécurité (travail en hauteur)', 'Combinaison de protection',
];
// Only categories where on-site machinery is plausible get the "machine"
// question — no point asking it for, say, garde d'enfants.
const MACHINES_BY_CATEGORY_SLUG = {
  menage: ['Autolaveuse', 'Monobrosse électrique', 'Nettoyeur vapeur professionnel', 'Aspirateur industriel', 'Nettoyeur haute pression'],
  bricolage: ['Perceuse à colonne', 'Scie circulaire', "Compresseur d'air", 'Ponceuse électrique', 'Groupe électrogène'],
  jardinage: ['Tondeuse autoportée', 'Débroussailleuse thermique', 'Broyeur de végétaux', 'Souffleur thermique', 'Motoculteur'],
  demenagement: ['Monte-meuble électrique', 'Diable motorisé', 'Chariot élévateur'],
  manutention: ['Chariot élévateur', 'Transpalette électrique', 'Gerbeur'],
  mecanique: ['Pont élévateur', "Compresseur d'air", 'Poste à souder', 'Valise de diagnostic électronique'],
  peinture: ['Pistolet à peinture électrique', 'Compresseur', 'Nacelle élévatrice', 'Ponceuse girafe'],
  plomberie: ['Furet électrique', 'Détecteur de fuite', 'Pompe de relevage'],
  electricite: ['Groupe électrogène', "Testeur d'installation électrique"],
  piscine: ['Robot de piscine professionnel', 'Pompe de vidange'],
};

const STEPS = [
  { key: 'details', label: 'Détails' },
  { key: 'lieu', label: 'Lieu' },
  { key: 'planning', label: 'Planning' },
  { key: 'recap', label: 'Récapitulatif' },
];

function CheckIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
    </svg>
  );
}

// Numbered step indicator, shared by mobile and desktop — filled/checked
// steps use the brand blue/yellow pair everywhone else in the app uses for
// "current position" chrome (mission nav, account back button).
function StepIndicator({ step, onStepClick, canReach }) {
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
                i < step ? 'bg-blue-600 text-yellow-300' : i === step ? 'bg-blue-600 text-yellow-300 ring-4 ring-blue-100' : 'bg-slate-100 text-slate-400'
              }`}
            >
              {i < step ? <CheckIcon className="h-4 w-4" /> : i + 1}
            </span>
            <span className={`hidden text-xs font-medium sm:block ${i <= step ? 'text-ink' : 'text-slate-400'}`}>{s.label}</span>
          </button>
          {i < STEPS.length - 1 && <div className={`mx-2 h-0.5 w-6 sm:w-12 ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />}
        </div>
      ))}
    </div>
  );
}

// White rounded-2xl card, the same "block" shell used across the app
// (mission detail stat cards, account dashboard) — gives the multi-step
// form its "gallery of blocks" look instead of one long flat scroll.
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
  const [step, setStep] = useState(0);
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
    difficulty: '',
    workAtHeight: null,
    recurrenceType: 'PONCTUEL',
    recurrenceCount: 1,
    recurrenceUnit: 'SEMAINE',
    requiredEquipmentIds: [],
    otherEquipmentChecked: false,
    otherEquipmentNote: '',
    requiredVehicleTypes: [],
    otherVehicleChecked: false,
    otherVehicleNote: '',
    isMultiDay: false,
    missionEndDate: '',
    equipmentProvidedByCompany: false,
    ppeProvidedByCompany: false,
    requiredPpe: [],
    requiresMachine: false,
    requiredMachines: [],
    isGetMission: false,
    getMissionPrice: 100,
    requiredBadges: [],
    accessInstructions: '',
    parkingDifficulty: '',
    accessType: '',
    numberOfPeople: 1,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.categories().then(({ categories }) => setCategories(categories)).catch(() => {});
  }, []);

  const isCompany = user?.accountKind === 'COMPANY';
  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const isTransportMission = selectedCategory && TRANSPORT_CATEGORY_SLUGS.includes(selectedCategory.slug);
  const selectedService = selectedCategory?.services?.find((s) => s.id === form.serviceId);
  const detailFields = selectedService?.detailFields || [];
  const vehicleOptions = selectedCategory && SIMPLE_VEHICLE_CATEGORY_SLUGS.includes(selectedCategory.slug)
    ? VEHICLES.filter((v) => SIMPLE_VEHICLE_TYPES.includes(v.type))
    : VEHICLES;
  const machineOptions = selectedCategory ? MACHINES_BY_CATEGORY_SLUG[selectedCategory.slug] : null;
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

  function toggleRequiredPpe(item) {
    setForm((f) => ({
      ...f,
      requiredPpe: f.requiredPpe.includes(item) ? f.requiredPpe.filter((p) => p !== item) : [...f.requiredPpe, item],
    }));
  }

  function toggleRequiredMachine(item) {
    setForm((f) => ({
      ...f,
      requiredMachines: f.requiredMachines.includes(item)
        ? f.requiredMachines.filter((m) => m !== item)
        : [...f.requiredMachines, item],
    }));
  }

  // Tenure/missions/reviews/expertise are tiered series (e.g. "1 to 5
  // missions" vs "100+ missions") — checking more than one tier per series
  // would create meaningless combinations, so selecting a new tier there
  // replaces the previous one instead of adding to it. PRO ("status") has
  // no series, so it stays a plain independent checkbox.
  const EXCLUSIVE_BADGE_CATEGORIES = ['tenure', 'missions', 'reviews', 'expertise'];

  function toggleRequiredBadge(key, category) {
    setForm((f) => {
      if (f.requiredBadges.includes(key)) {
        return { ...f, requiredBadges: f.requiredBadges.filter((b) => b !== key) };
      }
      const sameSeries = EXCLUSIVE_BADGE_CATEGORIES.includes(category)
        ? REQUIRABLE_BADGES.filter((k) => BADGE_CATALOG[k].category === category)
        : [];
      return { ...f, requiredBadges: [...f.requiredBadges.filter((b) => !sameSeries.includes(b)), key] };
    });
  }

  // Minimum required fields per step — gates "Suivant"/the step indicator
  // rather than relying on native HTML `required` (which only sees whatever
  // step is currently mounted). Final submit still re-validates everything.
  function stepComplete(i) {
    if (i === 0) return !!(form.categoryId && form.title.trim() && form.description.trim());
    if (i === 1) return !!(form.address && (!isTransportMission || form.dropoffAddress));
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

  async function onSubmit(e) {
    e.preventDefault();
    if (!user) { router.push('/auth/register'); return; }
    if (!stepComplete(0) || !stepComplete(1) || !stepComplete(2)) { setError('Merci de compléter toutes les étapes précédentes.'); return; }
    setError('');
    setLoading(true);
    try {
      const { desiredTime, otherEquipmentChecked, otherVehicleChecked, recurrenceType, isMultiDay, ...rest } = form;
      const isRecurring = recurrenceType === 'RECURRENT';
      // Combine as local wall-clock time before converting to an
      // unambiguous ISO string, so the stored instant matches what the
      // user actually picked regardless of server timezone.
      const [year, month, day] = form.desiredDate.split('-').map(Number);
      const [hour, minute] = desiredTime.split(':').map(Number);
      const desiredDateTime = new Date(year, month - 1, day, hour, minute).toISOString();
      const missionEndDateTime = isMultiDay && form.missionEndDate
        ? new Date(`${form.missionEndDate}T12:00:00`).toISOString()
        : undefined;

      const { mission } = await api.createMission(
        {
          ...rest,
          desiredDate: desiredDateTime,
          missionEndDate: missionEndDateTime,
          workAtHeight: form.workAtHeight ?? undefined,
          estimatedHours: Number(form.estimatedHours),
          otherEquipmentNote: otherEquipmentChecked ? form.otherEquipmentNote.trim() : '',
          otherVehicleNote: otherVehicleChecked ? form.otherVehicleNote.trim() : '',
          details: Object.fromEntries(Object.entries(form.details).filter(([, v]) => v !== '' && v != null)),
          type: isLessonMode ? 'LESSON' : 'TASK',
          isRecurring,
          recurrenceCount: isRecurring ? Number(form.recurrenceCount) : undefined,
          recurrenceUnit: isRecurring ? form.recurrenceUnit : undefined,
          requiredPpe: form.ppeProvidedByCompany ? form.requiredPpe : [],
          requiredMachines: form.requiresMachine ? form.requiredMachines : [],
          getMissionPrice: form.isGetMission ? Number(form.getMissionPrice) : undefined,
          difficulty: form.difficulty || undefined,
          accessInstructions: form.accessInstructions.trim(),
          parkingDifficulty: form.parkingDifficulty || undefined,
          accessType: form.accessType || undefined,
          numberOfPeople: Number(form.numberOfPeople) || 1,
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
    <div className="max-w-6xl">
      <h1 className="font-display text-3xl font-semibold text-ink">
        {isLessonMode ? 'Décrivez le cours que vous recherchez' : 'Publier une mission'}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {isLessonMode
          ? 'Un jobber qui propose des cours dans cette catégorie viendra vous apprendre chez vous.'
          : 'Décrivez votre besoin en quelques étapes simples.'}
      </p>

      {!authLoading && !user && (
        <p className="mt-4 rounded-md bg-ochre-light px-4 py-3 text-sm text-ochre-dark">
          Vous devrez <a href="/auth/register" className="font-medium underline">créer votre compte</a> pour publier — vous ne perdrez pas votre saisie.
        </p>
      )}

      <div className="mt-6">
        <StepIndicator step={step} onStepClick={(i) => canReach(i) && setStep(i)} canReach={canReach} />
      </div>

      <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {step === 0 && (
            <>
              <Block title="1. Détails de la mission" subtitle="Commencez par décrire précisément votre besoin.">
                <div className="space-y-4">
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
                    <div className="rounded-lg border border-slate-100 bg-paper p-4">
                      <span className="text-sm font-semibold text-ink">Précisions sur « {selectedService.name} »</span>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {detailFields.map((field) => {
                          if (field.showIf && form.details[field.showIf.key] !== field.showIf.equals) return null;
                          return (
                            <DetailField
                              key={field.key}
                              field={field}
                              value={form.details[field.key]}
                              onChange={(v) => setDetail(field.key, v)}
                              otherValue={form.details[`${field.key}Precision`]}
                              onOtherChange={(v) => setDetail(`${field.key}Precision`, v)}
                            />
                          );
                        })}
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
                  <div>
                    <span className="text-xs font-medium text-slate-500">Photos (optionnel, jusqu'à 5)</span>
                    <div className="mt-1">
                      <MissionPhotosUpload photos={form.photos} onChange={(photos) => setForm({ ...form, photos })} />
                    </div>
                  </div>
                </div>
              </Block>

              <Block title="Options et difficulté">
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
                    <span className="text-xs font-medium text-slate-500">Difficulté (optionnel)</span>
                    <p className="mt-0.5 text-xs text-slate-400">Votre propre estimation — juste indicatif pour le jobber, jamais vérifié.</p>
                    <div className="mt-2 grid grid-cols-3 gap-3">
                      {[
                        ['FACILE', 'Facile'],
                        ['MOYEN', 'Moyen'],
                        ['DIFFICILE', 'Difficile'],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, difficulty: f.difficulty === value ? '' : value }))}
                          className={`rounded-lg border-2 py-3 text-center text-sm font-semibold transition ${
                            form.difficulty === value ? 'border-moss bg-moss text-white' : 'border-slate-200 text-slate-500 hover:border-moss hover:text-moss'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
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
                </div>
              </Block>

              {!isLessonMode && selectedCategory?.equipment?.length > 0 && (
                <Block title="Outils & matériel" subtitle="Sélectionnez les outils nécessaires pour cette mission.">
                  {isCompany && (
                    <label className="mb-3 flex items-center gap-2.5 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={form.equipmentProvidedByCompany}
                        onChange={(e) => setForm((f) => ({ ...f, equipmentProvidedByCompany: e.target.checked }))}
                        className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
                      />
                      Ce matériel est fourni par l'entreprise (sinon, le jobber doit être équipé)
                    </label>
                  )}
                  <div className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
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
                </Block>
              )}

              {!isLessonMode && (
                <Block title="Véhicule requis" subtitle="Cochez le ou les véhicules requis pour cette mission.">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {vehicleOptions.map((v) => {
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
                </Block>
              )}

              <Block title="Nombre de personnes">
                <label className="block max-w-[160px]">
                  <span className="text-xs font-medium text-slate-500">Jobbers attendus sur la mission</span>
                  <select
                    value={form.numberOfPeople}
                    onChange={(e) => setForm((f) => ({ ...f, numberOfPeople: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n} personne{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </label>
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
                        form.workAtHeight === false ? 'border-moss bg-moss text-white' : 'border-slate-200 text-slate-500 hover:border-moss hover:text-moss'
                      }`}
                    >
                      Non
                    </button>
                  </div>
                </Block>
              )}

              {isCompany && !isLessonMode && (
                <Block title="Équipements de protection (EPI)">
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                    <input
                      type="checkbox"
                      checked={form.ppeProvidedByCompany}
                      onChange={(e) => setForm((f) => ({ ...f, ppeProvidedByCompany: e.target.checked }))}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
                    />
                    Fournissez-vous les équipements de protection individuelle (EPI) nécessaires ?
                  </label>
                  {form.ppeProvidedByCompany && (
                    <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
                      {PPE_LIST.map((item) => (
                        <label key={item} className="flex items-center gap-2.5 text-base text-ink">
                          <input
                            type="checkbox"
                            checked={form.requiredPpe.includes(item)}
                            onChange={() => toggleRequiredPpe(item)}
                            className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  )}
                </Block>
              )}

              {isCompany && !isLessonMode && machineOptions && (
                <Block title="Machine sur place">
                  <label className="flex items-center gap-2.5 text-sm font-semibold text-ink">
                    <input
                      type="checkbox"
                      checked={form.requiresMachine}
                      onChange={(e) => setForm((f) => ({ ...f, requiresMachine: e.target.checked }))}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
                    />
                    Le jobber devra-t-il utiliser une machine sur le lieu de la mission ?
                  </label>
                  {form.requiresMachine && (
                    <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
                      {machineOptions.map((item) => (
                        <label key={item} className="flex items-center gap-2.5 text-base text-ink">
                          <input
                            type="checkbox"
                            checked={form.requiredMachines.includes(item)}
                            onChange={() => toggleRequiredMachine(item)}
                            className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  )}
                </Block>
              )}

              {isCompany && !isLessonMode && (
                <Block title="Publier en GET Mission ?" subtitle="Fixez un tarif intégral non négociable pour toute la mission. Le premier jobber qui coche toutes vos conditions peut la prendre instantanément — premier arrivé, premier servi.">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, isGetMission: true }))}
                      className={`rounded-lg border-2 py-3 text-center font-display text-base font-bold uppercase tracking-wide transition ${
                        form.isGetMission ? 'border-green-600 bg-green-600 text-white' : 'border-slate-200 text-slate-500 hover:border-green-600 hover:text-green-600'
                      }`}
                    >
                      Oui
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, isGetMission: false }))}
                      className={`rounded-lg border-2 py-3 text-center font-display text-base font-bold uppercase tracking-wide transition ${
                        !form.isGetMission ? 'border-moss bg-moss text-white' : 'border-slate-200 text-slate-500 hover:border-moss hover:text-moss'
                      }`}
                    >
                      Non
                    </button>
                  </div>

                  {form.isGetMission && (
                    <div className="mt-5 flex items-center justify-center gap-6">
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, getMissionPrice: Math.max(10, Number(f.getMissionPrice) - 5) }))}
                        aria-label="Diminuer le tarif"
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-2xl font-semibold text-white hover:bg-green-700"
                      >
                        −
                      </button>
                      <span className="min-w-[9rem] text-center font-display text-4xl font-bold text-ink">{form.getMissionPrice} €</span>
                      <button
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, getMissionPrice: Number(f.getMissionPrice) + 5 }))}
                        aria-label="Augmenter le tarif"
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-2xl font-semibold text-white hover:bg-green-700"
                      >
                        +
                      </button>
                    </div>
                  )}
                </Block>
              )}

              {!isLessonMode && (
                <Block title="Badges souhaités chez le jobber (optionnel)" subtitle="Le badge PRO est le seul qui restreint réellement les candidatures — les autres sont indicatifs et affichés sur la vignette de la mission, sans empêcher qui que ce soit de postuler.">
                  {Object.entries(
                    REQUIRABLE_BADGES.reduce((groups, key) => {
                      const cat = BADGE_CATALOG[key].category;
                      (groups[cat] = groups[cat] || []).push(key);
                      return groups;
                    }, {})
                  ).map(([cat, keys]) => (
                    <div key={cat} className="mt-3 first:mt-0">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{BADGE_CATEGORY_LABELS[cat]}</span>
                      <div className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                        {keys.map((key) => (
                          <label key={key} className="flex items-start gap-2.5 text-sm text-ink">
                            <input
                              type="checkbox"
                              checked={form.requiredBadges.includes(key)}
                              onChange={() => toggleRequiredBadge(key, cat)}
                              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
                            />
                            <span>
                              <span className="font-medium">{BADGE_CATALOG[key].icon} {BADGE_CATALOG[key].name}</span>
                              <span className="block text-xs text-slate-400">{BADGE_CATALOG[key].label}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </Block>
              )}
            </>
          )}

          {step === 1 && (
            <Block title="2. Lieu de la mission" subtitle="Indiquez l'adresse précise où la mission doit être réalisée.">
              <div className="space-y-4">
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

                <label className="block">
                  <span className="text-xs font-medium text-slate-500">Instructions d'accès (facultatif)</span>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={form.accessInstructions}
                    onChange={(e) => setForm({ ...form, accessInstructions: e.target.value })}
                    placeholder="Ex : Code porte 1234A - Appartement au 2ème étage à gauche"
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
                  />
                  <span className="mt-1 flex items-center justify-between text-xs text-slate-400">
                    <span>Visible uniquement par le jobber une fois sélectionné.</span>
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
                          form.parkingDifficulty === value ? 'border-moss bg-moss-light' : 'border-slate-200 hover:border-moss'
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
                          form.accessType === value ? 'border-moss bg-moss text-white' : 'border-slate-200 text-slate-500 hover:border-moss hover:text-moss'
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
            <Block title="3. Planning" subtitle="Quand la mission doit-elle avoir lieu ?">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date souhaitée" type="date" value={form.desiredDate} onChange={(v) => setForm({ ...form, desiredDate: v })} required />
                  <Field label="Heure de début" type="time" value={form.desiredTime} onChange={(v) => setForm({ ...form, desiredTime: v })} required />
                </div>
                <Field label="Durée estimée (heures)" type="number" min="0.5" step="0.5" value={form.estimatedHours} onChange={(v) => setForm({ ...form, estimatedHours: v })} required />

                {isCompany && (
                  <div>
                    <label className="flex items-center gap-2.5 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={form.isMultiDay}
                        onChange={(e) => setForm((f) => ({ ...f, isMultiDay: e.target.checked }))}
                        className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
                      />
                      Cette mission dure-t-elle plusieurs jours ?
                    </label>
                    {form.isMultiDay && (
                      <div className="mt-3">
                        <Field
                          label="Date de fin"
                          type="date"
                          min={form.desiredDate || new Date().toISOString().slice(0, 10)}
                          value={form.missionEndDate}
                          onChange={(v) => setForm({ ...form, missionEndDate: v })}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Block>
          )}

          {step === 3 && (
            <Block title="4. Récapitulatif" subtitle="Vérifiez les informations avant de publier.">
              <dl className="space-y-3 text-sm">
                <RecapRow label="Catégorie" value={selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : '—'} />
                <RecapRow label="Titre" value={form.title || '—'} />
                <RecapRow label="Description" value={form.description || '—'} multiline />
                <RecapRow label="Adresse" value={form.address || '—'} />
                {isTransportMission && <RecapRow label="Arrivée" value={form.dropoffAddress || '—'} />}
                {form.accessInstructions && <RecapRow label="Instructions d'accès" value={form.accessInstructions} multiline />}
                {form.parkingDifficulty && <RecapRow label="Stationnement" value={{ FACILE: 'Facile', PAYANT: 'Payant', DIFFICILE: 'Difficile' }[form.parkingDifficulty]} />}
                {form.accessType && <RecapRow label="Type d'accès" value={{ PLAIN_PIED: 'Plain-pied', ESCALIERS: 'Escaliers', ASCENSEUR: 'Ascenseur', AUTRE: 'Autre' }[form.accessType]} />}
                <RecapRow label="Nombre de personnes" value={`${form.numberOfPeople}`} />
                <RecapRow label="Date" value={form.desiredDate ? `${form.desiredDate} à ${form.desiredTime}` : '—'} />
                <RecapRow label="Durée estimée" value={`${form.estimatedHours} h`} />
                {form.difficulty && <RecapRow label="Difficulté" value={form.difficulty} />}
                <RecapRow
                  label="Options"
                  value={[form.isUrgent && 'Urgent', form.datesFlexible && 'Dates flexibles', form.recurrenceType === 'RECURRENT' && 'Récurrent'].filter(Boolean).join(', ') || 'Aucune'}
                />
              </dl>

              {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

              <button
                disabled={loading}
                className="mt-5 w-full rounded-full bg-blue-600 py-3.5 font-display text-sm font-semibold text-yellow-300 hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Publication…' : isLessonMode ? 'Publier la demande de cours' : 'Publier la mission'}
              </button>
            </Block>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(s - 1, 0))}
              className={`rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:border-moss ${step === 0 ? 'invisible' : ''}`}
            >
              ← Étape précédente
            </button>
            {step < STEPS.length - 1 && (
              <button
                type="button"
                onClick={goNext}
                disabled={!stepComplete(step)}
                className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-yellow-300 hover:bg-blue-700 disabled:opacity-40"
              >
                Étape suivante →
              </button>
            )}
          </div>
        </div>

        {/* Live preview — desktop only, mirrors what the finished mission
            tile/detail page will look like as the form is filled in. */}
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <MissionPreview form={form} selectedCategory={selectedCategory} isTransportMission={isTransportMission} />
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

function MissionPreview({ form, selectedCategory, isTransportMission }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span>👁️</span> Aperçu de votre mission
      </div>
      <p className="mt-1 text-xs text-slate-400">Voici ce que verront les jobbers.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.name}` : 'Catégorie'}
        </span>
        {form.isUrgent && <span className="rounded-full bg-clay px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Urgent</span>}
        {form.datesFlexible && <span className="rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Dates flexibles</span>}
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold text-ink">{form.title || 'Titre de la mission'}</h3>
      <p className="mt-1.5 line-clamp-3 text-sm text-slate-500">{form.description || 'La description apparaîtra ici.'}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-paper p-3">
          <div className="text-xs text-slate-400">Durée estimée</div>
          <div className="mt-0.5 font-display text-base font-bold text-ink">{form.estimatedHours || '—'} h</div>
        </div>
        <div className="rounded-lg bg-paper p-3">
          <div className="text-xs text-slate-400">Difficulté</div>
          <div className="mt-0.5 font-display text-base font-bold text-ink">{form.difficulty ? { FACILE: 'Facile', MOYEN: 'Moyen', DIFFICILE: 'Difficile' }[form.difficulty] : 'Non précisée'}</div>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="text-xs text-slate-400">Adresse de la mission</div>
        <div className="mt-0.5 text-sm font-medium text-ink">{form.address || 'À renseigner'}</div>
        {isTransportMission && (
          <>
            <div className="mt-2 text-xs text-slate-400">Arrivée</div>
            <div className="mt-0.5 text-sm font-medium text-ink">{form.dropoffAddress || 'À renseigner'}</div>
          </>
        )}
      </div>

      {form.desiredDate && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="text-xs text-slate-400">Date souhaitée</div>
          <div className="mt-0.5 text-sm font-medium text-ink">
            {new Date(`${form.desiredDate}T${form.desiredTime || '00:00'}`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {form.desiredTime}
          </div>
        </div>
      )}

      {form.isGetMission && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-center">
          <div className="text-xs text-green-700">Tarif fixe (GET Mission)</div>
          <div className="font-display text-xl font-bold text-green-700">{form.getMissionPrice} €</div>
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
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
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
    // Grouped fields carry `groups: [{ title, options }]`; ungrouped ones
    // just carry a flat `options` list — normalize to one shape here.
    const groups = field.groups || [{ title: null, options: field.options || [] }];
    return (
      <div className="sm:col-span-2">
        <span className="text-xs font-medium text-slate-500">{field.label}</span>
        <div className="mt-2 space-y-4">
          {groups.map((group) => (
            <div key={group.title || 'default'}>
              {group.title && (
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-moss">{group.title}</div>
              )}
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {group.options.map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={selected.includes(opt)}
                      onChange={() => toggle(opt)}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
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
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
          >
            <option value="">Choisir…</option>
            {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
        {field.other && value === 'Autre' && (
          <label className="mt-2 block">
            <span className="text-xs font-medium text-slate-500">Précisez</span>
            <input
              type="text"
              value={otherValue ?? ''}
              onChange={(e) => onOtherChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
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
