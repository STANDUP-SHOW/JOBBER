'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import StarRating from '../../../components/StarRating';
import ZoneSummaryCard from '../../../components/ZoneSummaryCard';
import VehicleIcon, { VEHICLES } from '../../../components/VehicleIcon';

const LEVELS = [
  { value: 'PROFESSIONNEL', label: 'Professionnel', activeClass: 'bg-purple-600 text-white' },
  { value: 'EXPERT', label: 'Expert', activeClass: 'bg-green-600 text-white' },
  { value: 'PASSIONNE', label: 'Passionné', activeClass: 'bg-ochre text-ink' },
];

// French SIRET: 14 digits, valid under the Luhn checksum.
function isValidSiret(siret) {
  if (typeof siret !== 'string' || !/^\d{14}$/.test(siret)) return false;
  let sum = 0;
  for (let i = 0; i < siret.length; i++) {
    let digit = Number(siret[i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export default function ProviderProfilePage() {
  const { user, token, login, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    autoApply: false,
    siret: '',
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [levels, setLevels] = useState({}); // { [categoryId]: 'PROFESSIONNEL' | 'EXPERT' | 'PASSIONNE' }
  const [rates, setRates] = useState({}); // { [categoryId]: hourlyRate }
  const [bios, setBios] = useState({}); // { [categoryId]: bio text }
  const [generatingBioFor, setGeneratingBioFor] = useState(null); // categoryId currently generating
  const [serviceIds, setServiceIds] = useState([]);
  const [equipmentIds, setEquipmentIds] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
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
      setSelectedCategoryIds((profile.categories || []).map((c) => c.categoryId));
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

  function setLevel(categoryId, level) {
    setLevels((l) => ({ ...l, [categoryId]: level }));
  }

  function setRate(categoryId, rate) {
    setRates((r) => ({ ...r, [categoryId]: rate }));
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
    <div className="mx-auto max-w-xl">
      <span className="label-eyebrow text-moss">Mon profil</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Profil jobber</h1>
      <p className="mt-1 text-sm text-slate-500">Ces informations sont visibles par les clients et déterminent les missions qui vous sont proposées.</p>

      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
        <StarRating value={user.providerProfile?.ratingAverage ?? 0} size={16} />
        {user.providerProfile?.ratingCount > 0 ? (
          <span>{user.providerProfile.ratingAverage.toFixed(1)} ({user.providerProfile.ratingCount} avis) · {user.providerProfile.completedMissions} missions réalisées</span>
        ) : (
          <span>Pas encore d'avis</span>
        )}
      </div>

      <div className="mt-6">
        <ZoneSummaryCard />
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.autoApply}
            onChange={(e) => setForm({ ...form, autoApply: e.target.checked })}
            className="rounded border-slate-300"
          />
          Candidater automatiquement aux nouvelles missions de mes catégories
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-500">Numéro SIRET</span>
          <input
            type="text"
            inputMode="numeric"
            maxLength={14}
            value={form.siret}
            onChange={(e) => setForm({ ...form, siret: e.target.value.replace(/\D/g, '') })}
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            placeholder="14 chiffres"
          />
          <span className="mt-1 block text-xs text-slate-400">
            {form.siret && !isValidSiret(form.siret)
              ? 'Numéro invalide.'
              : "Requis pour déclarer le niveau Professionnel sur une compétence."}
          </span>
        </label>

        <div>
          <span className="text-xs font-medium text-slate-500">Compétences</span>
          <p className="mt-1 text-xs text-slate-400">
            Cochez vos domaines et les prestations précises que vous proposez, puis indiquez votre niveau pour chaque domaine.
          </p>
          <div className="mt-2 space-y-2">
            {categories.map((c) => {
              const active = selectedCategoryIds.includes(c.id);
              return (
                <div key={c.id} className="rounded-md border border-slate-200 p-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleCategory(c)}
                      className="rounded border-slate-300"
                    />
                    {c.icon} {c.name}
                  </label>

                  {active && (
                    <>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {LEVELS.map((lvl) => {
                          const locked = lvl.value === 'PROFESSIONNEL' && !isValidSiret(form.siret);
                          return (
                            <button
                              key={lvl.value}
                              type="button"
                              disabled={locked}
                              title={locked ? 'Renseignez un numéro SIRET valide ci-dessus pour choisir ce niveau' : undefined}
                              onClick={() => setLevel(c.id, lvl.value)}
                              className={`rounded-full px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                                levels[c.id] === lvl.value ? lvl.activeClass : 'border border-slate-200 text-slate-500'
                              }`}
                            >
                              {lvl.label}
                            </button>
                          );
                        })}
                        <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
                          Tarif horaire
                          <input
                            type="number" min="1" step="0.5"
                            value={rates[c.id] ?? 15}
                            onChange={(e) => setRate(c.id, e.target.value)}
                            className="w-16 rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-moss"
                          />
                          €/h
                        </label>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {c.services?.map((svc) => (
                          <label key={svc.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <input
                              type="checkbox"
                              checked={serviceIds.includes(svc.id)}
                              onChange={() => toggleService(c.id, svc.id)}
                              className="rounded border-slate-300"
                            />
                            {svc.name}
                          </label>
                        ))}
                      </div>

                      {c.equipment?.length > 0 && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <span className="text-xs font-medium text-slate-500">Matériel que je possède</span>
                          <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                            {c.equipment.map((eq) => (
                              <label key={eq.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={equipmentIds.includes(eq.id)}
                                  onChange={() => toggleEquipment(eq.id)}
                                  className="rounded border-slate-300"
                                />
                                {eq.name}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-500">Présentation pour "{c.name}"</span>
                          <button
                            type="button"
                            disabled={generatingBioFor === c.id}
                            onClick={() => generateBio(c)}
                            className="text-xs font-medium text-moss hover:text-moss-dark disabled:opacity-50"
                          >
                            {generatingBioFor === c.id ? 'Génération…' : '✨ Générer avec l\'IA'}
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={bios[c.id] || ''}
                          onChange={(e) => setBio(c.id, e.target.value)}
                          className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-xs outline-none focus:border-moss"
                          placeholder="Présentez votre expérience dans ce domaine, ou laissez l'IA rédiger une première version…"
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-slate-500">Mes véhicules</span>
          <p className="mt-1 text-xs text-slate-400">
            Cochez les véhicules dont vous disposez pour les missions nécessitant du transport.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {VEHICLES.map((v) => {
              const active = vehicleTypes.includes(v.type);
              return (
                <button
                  key={v.type}
                  type="button"
                  onClick={() => toggleVehicle(v.type)}
                  className={`flex flex-col items-center rounded-md border p-2 text-center ${
                    active ? 'border-moss bg-moss-light' : 'border-slate-200 bg-white'
                  }`}
                >
                  <VehicleIcon type={v.type} className={`h-8 w-12 ${active ? 'text-moss-dark' : 'text-slate-400'}`} />
                  <span className={`mt-1 text-xs font-medium ${active ? 'text-moss-dark' : 'text-ink'}`}>{v.label}</span>
                  {v.capacity && <span className="text-[10px] text-slate-400">{v.capacity}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
        {saved && <p className="rounded-md bg-moss-light px-3 py-2 text-sm text-moss-dark">Profil mis à jour.</p>}

        <button disabled={loading} className="w-full rounded-md bg-moss py-3 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
          {loading ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
