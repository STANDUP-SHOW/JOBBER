'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import StarRating from '../../../components/StarRating';
import ZoneSummaryCard from '../../../components/ZoneSummaryCard';
import VehicleIcon, { VEHICLES } from '../../../components/VehicleIcon';
import { isValidSiret } from '../../../lib/siret';

const LEVELS = [
  { value: 'PROFESSIONNEL', label: 'Professionnel', activeClass: 'bg-purple-600 text-white' },
  { value: 'EXPERT', label: 'Expert', activeClass: 'bg-green-600 text-white' },
  { value: 'PASSIONNE', label: 'Passionné', activeClass: 'bg-ochre text-ink' },
];

export default function ProviderProfilePage() {
  const { user, token, login, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    autoApply: false,
    siret: '',
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [levels, setLevels] = useState({}); // { [categoryId]: 'PROFESSIONNEL' | 'EXPERT' | 'PASSIONNE' }
  const [rates, setRates] = useState({}); // { [categoryId]: hourlyRate }
  const [bios, setBios] = useState({}); // { [categoryId]: bio text }
  const [generatingBioFor, setGeneratingBioFor] = useState(null); // categoryId currently generating
  const [serviceIds, setServiceIds] = useState([]);
  const [equipmentIds, setEquipmentIds] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);
  const [addSkillMenuOpen, setAddSkillMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
    else if (user?.accountKind === 'COMPANY') router.push('/account');
  }, [authLoading, user]);

  useEffect(() => {
    api.categories().then(({ categories }) => setCategories(categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!token || !user) return;
    const profile = user.providerProfile;
    if (profile) {
      setForm({
        autoApply: profile.autoApply ?? false,
        siret: profile.siret || '',
      });
      const catIds = (profile.categories || []).map((c) => c.categoryId);
      setSelectedCategoryIds(catIds);
      setActiveCategoryId((current) => current ?? catIds[0] ?? null);
      setLevels(Object.fromEntries((profile.categories || []).map((c) => [c.categoryId, c.level])));
      setRates(Object.fromEntries((profile.categories || []).map((c) => [c.categoryId, c.hourlyRate])));
      setBios(Object.fromEntries((profile.categories || []).map((c) => [c.categoryId, c.bio || ''])));
      setServiceIds((profile.services || []).map((s) => s.serviceId));
      setEquipmentIds((profile.equipment || []).map((e) => e.equipmentId));
      setVehicleTypes((profile.vehicles || []).map((v) => v.type));
    }
  }, [token, user]);

  function toggleVehicle(type) {
    setVehicleTypes((types) => (types.includes(type) ? types.filter((t) => t !== type) : [...types, type]));
  }

  function toggleCategory(category) {
    setSelectedCategoryIds((ids) => {
      if (ids.includes(category.id)) {
        setServiceIds((sids) => sids.filter((id) => !category.services.some((s) => s.id === id)));
        setEquipmentIds((eids) => eids.filter((id) => !category.equipment?.some((e) => e.id === id)));
        return ids.filter((id) => id !== category.id);
      }
      setLevels((l) => (l[category.id] ? l : { ...l, [category.id]: 'PASSIONNE' }));
      setRates((r) => (r[category.id] ? r : { ...r, [category.id]: 15 }));
      return [...ids, category.id];
    });
  }

  function toggleService(categoryId, serviceId) {
    setServiceIds((ids) => (ids.includes(serviceId) ? ids.filter((id) => id !== serviceId) : [...ids, serviceId]));
    setSelectedCategoryIds((ids) => (ids.includes(categoryId) ? ids : [...ids, categoryId]));
    setLevels((l) => (l[categoryId] ? l : { ...l, [categoryId]: 'PASSIONNE' }));
    setRates((r) => (r[categoryId] ? r : { ...r, [categoryId]: 15 }));
  }

  function toggleEquipment(equipmentId) {
    setEquipmentIds((ids) => (ids.includes(equipmentId) ? ids.filter((id) => id !== equipmentId) : [...ids, equipmentId]));
  }

  function toggleAllServices(category) {
    const catServiceIds = (category.services || []).map((s) => s.id);
    const allSelected = catServiceIds.every((id) => serviceIds.includes(id));
    setServiceIds((ids) => (allSelected
      ? ids.filter((id) => !catServiceIds.includes(id))
      : [...new Set([...ids, ...catServiceIds])]));
  }

  function toggleAllEquipment(category) {
    const catEquipmentIds = (category.equipment || []).map((e) => e.id);
    const allSelected = catEquipmentIds.every((id) => equipmentIds.includes(id));
    setEquipmentIds((ids) => (allSelected
      ? ids.filter((id) => !catEquipmentIds.includes(id))
      : [...new Set([...ids, ...catEquipmentIds])]));
  }

  function setLevel(categoryId, level) {
    setLevels((l) => ({ ...l, [categoryId]: level }));
  }

  function setRate(categoryId, rate) {
    setRates((r) => ({ ...r, [categoryId]: rate }));
  }

  function adjustRate(categoryId, delta) {
    setRates((r) => ({ ...r, [categoryId]: Math.max(5, (Number(r[categoryId]) || 15) + delta) }));
  }

  function setBio(categoryId, bio) {
    setBios((b) => ({ ...b, [categoryId]: bio }));
  }

  async function generateBio(category) {
    setGeneratingBioFor(category.id);
    setError('');
    try {
      const serviceNames = (category.services || [])
        .filter((svc) => serviceIds.includes(svc.id))
        .map((svc) => svc.name);
      const { bio } = await api.generateCategoryBio(
        { categoryId: category.id, level: levels[category.id] || 'PASSIONNE', serviceNames },
        token
      );
      setBio(category.id, bio);
    } catch (err) {
      setError(err.message);
    } finally {
      setGeneratingBioFor(null);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);

    const needsSiret = selectedCategoryIds.some((id) => levels[id] === 'PROFESSIONNEL');
    if (needsSiret && !isValidSiret(form.siret)) {
      setError('Un numéro SIRET valide (14 chiffres) est requis pour le niveau Professionnel.');
      return;
    }

    setLoading(true);
    try {
      await api.updateProviderProfile(
        {
          autoApply: form.autoApply,
          siret: form.siret,
          categories: selectedCategoryIds.map((categoryId) => ({
            categoryId,
            level: levels[categoryId] || 'PASSIONNE',
            hourlyRate: Number(rates[categoryId]) || 15,
            bio: bios[categoryId] || '',
          })),
          serviceIds,
          equipmentIds,
          vehicleTypes,
        },
        token
      );
      const { user: refreshed } = await api.me(token);
      login(token, refreshed);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl">
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Profil jobber</h1>
      <p className="mt-1 text-sm text-slate-500">Ces informations sont visibles par les clients et déterminent les missions qui vous sont proposées.</p>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
        <StarRating value={user.providerProfile?.ratingAverage ?? 0} size={16} />
        {user.providerProfile?.ratingCount > 0 ? (
          <span>{user.providerProfile.ratingAverage.toFixed(1)} ({user.providerProfile.ratingCount} avis) · {user.providerProfile.completedMissions} missions réalisées</span>
        ) : (
          <span>Pas encore d'avis</span>
        )}
        <Link href={`/providers/${user.id}`} className="ml-auto font-medium text-moss hover:underline">
          Voir mon profil public →
        </Link>
      </div>

      <div className="mt-6">
        <ZoneSummaryCard />
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <label className="flex items-center gap-3 text-base text-ink">
          <input
            type="checkbox"
            checked={form.autoApply}
            onChange={(e) => setForm({ ...form, autoApply: e.target.checked })}
            className="h-5 w-5 shrink-0 rounded border-slate-300 accent-moss"
          />
          Candidater automatiquement aux nouvelles missions de mes catégories
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-ink">Numéro SIRET</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={14}
            value={form.siret}
            onChange={(e) => setForm({ ...form, siret: e.target.value.replace(/\D/g, '') })}
            className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-moss"
            placeholder="14 chiffres"
          />
          <span className="mt-1.5 block text-sm text-slate-400">
            {form.siret && !isValidSiret(form.siret)
              ? 'Numéro invalide.'
              : "Requis pour déclarer le niveau Professionnel sur une compétence."}
          </span>
        </label>

        <div>
          <span className="text-sm font-semibold text-ink">Compétences</span>
          <p className="mt-1 text-sm text-slate-500">
            Choisissez un domaine ci-dessous pour l'ajouter et régler son niveau, son tarif et ses prestations.
          </p>

          <div className="relative mt-3">
            <button
              type="button"
              onClick={() => setAddSkillMenuOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-lg border-2 border-dashed border-slate-300 px-4 py-3 text-base font-semibold text-moss hover:border-moss"
            >
              <span className="flex items-center gap-2"><span aria-hidden>＋</span> Ajouter une compétence</span>
              <span aria-hidden className={`transition-transform ${addSkillMenuOpen ? 'rotate-180' : ''}`}>⌄</span>
            </button>

            {addSkillMenuOpen && (
              <div className="absolute z-10 mt-2 max-h-96 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                {categories.filter((c) => !selectedCategoryIds.includes(c.id)).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setActiveCategoryId(c.id); setAddSkillMenuOpen(false); }}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left hover:bg-moss-light"
                  >
                    <span className="text-3xl" aria-hidden>{c.icon}</span>
                    <span className="text-base font-medium text-ink">{c.name}</span>
                  </button>
                ))}
                {categories.every((c) => selectedCategoryIds.includes(c.id)) && (
                  <p className="px-3 py-2.5 text-sm text-slate-400">Toutes les compétences sont déjà dans votre profil.</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            {categories
              .filter((cat) => selectedCategoryIds.includes(cat.id) && cat.id !== activeCategoryId)
              .map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategoryId(cat.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-moss-light bg-moss-light/40 p-4 text-left hover:border-moss"
                >
                  <span className="flex items-center gap-2 text-base font-semibold text-moss-dark">
                    <span aria-hidden>✓</span> <span className="text-xl">{cat.icon}</span> Compétence {cat.name} validée
                  </span>
                  <span className="text-sm font-semibold text-moss">Modifier</span>
                </button>
              ))}

          {activeCategoryId && (() => {
            const c = categories.find((cat) => cat.id === activeCategoryId);
            if (!c) return null;
            const active = selectedCategoryIds.includes(c.id);
            return (
              <div className="rounded-lg border border-moss p-4">
                <label className="flex items-center gap-3 text-lg font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleCategory(c)}
                    className="h-5 w-5 shrink-0 rounded border-slate-300 accent-moss"
                  />
                  <span className="text-xl">{c.icon}</span> {c.name}
                </label>
                <p className="mt-1 text-xs text-slate-400">
                  {active ? 'Cette compétence fait partie de votre profil.' : 'Cochez pour proposer cette compétence.'}
                </p>

                {active && (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-2.5">
                      {LEVELS.map((lvl) => {
                        const locked = lvl.value === 'PROFESSIONNEL' && !isValidSiret(form.siret);
                        return (
                          <button
                            key={lvl.value}
                            type="button"
                            disabled={locked}
                            title={locked ? 'Renseignez un numéro SIRET valide ci-dessus pour choisir ce niveau' : undefined}
                            onClick={() => setLevel(c.id, lvl.value)}
                            className={`rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                              levels[c.id] === lvl.value ? lvl.activeClass : 'border-2 border-slate-200 text-slate-500'
                            }`}
                          >
                            {lvl.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-5">
                      <button
                        type="button"
                        onClick={() => adjustRate(c.id, -1)}
                        aria-label="Diminuer le tarif"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss text-2xl font-semibold text-white hover:bg-moss-dark"
                      >
                        −
                      </button>
                      <div className="text-center">
                        <div className="font-display text-2xl font-bold text-ink">{rates[c.id] ?? 15} €/h</div>
                        <div className="text-xs text-slate-400">Tarif horaire</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => adjustRate(c.id, 1)}
                        aria-label="Augmenter le tarif"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss text-2xl font-semibold text-white hover:bg-moss-dark"
                      >
                        +
                      </button>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-600">Prestations proposées</span>
                        {c.services?.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleAllServices(c)}
                            className="text-sm font-semibold text-moss hover:text-moss-dark"
                          >
                            {c.services.every((svc) => serviceIds.includes(svc.id)) ? 'Tout décocher' : 'Tout cocher'}
                          </button>
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
                        {c.services?.map((svc) => (
                          <label key={svc.id} className="flex items-center gap-2.5 text-base text-ink">
                            <input
                              type="checkbox"
                              checked={serviceIds.includes(svc.id)}
                              onChange={() => toggleService(c.id, svc.id)}
                              className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
                            />
                            {svc.name}
                          </label>
                        ))}
                      </div>
                    </div>

                    {c.equipment?.length > 0 && (
                      <div className="mt-4 border-t border-slate-100 pt-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-600">Matériel que je possède</span>
                          <button
                            type="button"
                            onClick={() => toggleAllEquipment(c)}
                            className="text-sm font-semibold text-moss hover:text-moss-dark"
                          >
                            {c.equipment.every((eq) => equipmentIds.includes(eq.id)) ? 'Tout décocher' : 'Tout cocher'}
                          </button>
                        </div>
                        <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-2">
                          {c.equipment.map((eq) => (
                            <label key={eq.id} className="flex items-center gap-2.5 text-base text-ink">
                              <input
                                type="checkbox"
                                checked={equipmentIds.includes(eq.id)}
                                onChange={() => toggleEquipment(eq.id)}
                                className="h-4 w-4 shrink-0 rounded border-slate-300 accent-moss"
                              />
                              {eq.name}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-600">Présentation pour « {c.name} »</span>
                        <button
                          type="button"
                          disabled={generatingBioFor === c.id}
                          onClick={() => generateBio(c)}
                          className="text-sm font-semibold text-moss hover:text-moss-dark disabled:opacity-50"
                        >
                          {generatingBioFor === c.id ? 'Génération…' : '✨ Générer avec l\'IA'}
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={bios[c.id] || ''}
                        onChange={(e) => setBio(c.id, e.target.value)}
                        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-base outline-none focus:border-moss"
                        placeholder="Présentez votre expérience dans ce domaine, ou laissez l'IA rédiger une première version…"
                      />
                    </div>

                    {active && (
                      <button
                        type="button"
                        onClick={() => setActiveCategoryId(null)}
                        className="mt-4 w-full rounded-md bg-moss py-2.5 text-sm font-semibold text-white hover:bg-moss-dark"
                      >
                        Valider cette compétence
                      </button>
                    )}
                  </>
                )}
              </div>
            );
          })()}
          </div>
        </div>

        <div>
          <span className="text-sm font-semibold text-ink">Mes véhicules</span>
          <p className="mt-1 text-sm text-slate-500">
            Cochez les véhicules dont vous disposez pour les missions nécessitant du transport.
          </p>
          {vehicleTypes.length > 0 && !vehiclePickerOpen ? (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {VEHICLES.filter((v) => vehicleTypes.includes(v.type)).map((v) => (
                <div key={v.type} className="flex flex-col items-center rounded-lg border-2 border-moss bg-moss-light p-3 text-center">
                  <VehicleIcon type={v.type} className="h-9 w-14 text-moss-dark" />
                  <span className="mt-1.5 text-sm font-semibold text-moss-dark">{v.label}</span>
                  {v.capacity && <span className="text-xs text-slate-400">{v.capacity}</span>}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setVehiclePickerOpen(true)}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 p-3 text-center text-sm font-semibold text-moss hover:border-moss"
              >
                <span className="text-xl" aria-hidden>＋</span> Ajouter un véhicule
              </button>
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {VEHICLES.map((v) => {
                  const active = vehicleTypes.includes(v.type);
                  return (
                    <button
                      key={v.type}
                      type="button"
                      onClick={() => toggleVehicle(v.type)}
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
              {vehicleTypes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setVehiclePickerOpen(false)}
                  className="mt-3 text-sm font-semibold text-moss hover:text-moss-dark"
                >
                  Terminé
                </button>
              )}
            </>
          )}
        </div>

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        {saved && <p className="rounded-md bg-moss-light px-3 py-2 text-sm text-moss-dark">Profil mis à jour.</p>}

        <button disabled={loading} className="w-full rounded-md bg-moss py-3.5 text-base font-semibold text-paper hover:bg-moss-dark disabled:opacity-60">
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
