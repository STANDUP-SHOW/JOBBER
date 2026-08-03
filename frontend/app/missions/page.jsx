'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import Link from 'next/link';
import MissionCard from '../../components/MissionCard';
import ZoneSummaryCard from '../../components/ZoneSummaryCard';

const MissionsMap = dynamic(() => import('../../components/MissionsMap'), {
  ssr: false,
  loading: () => <p className="mt-6 text-slate-400">Chargement de la carte…</p>,
});

export default function MissionsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [missions, setMissions] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [posterFilter, setPosterFilter] = useState('ALL'); // ALL | INDIVIDUAL | COMPANY
  const [getOnly, setGetOnly] = useState(false);
  const [view, setView] = useState('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const providerZone =
    user && user.lat != null && user.lng != null
      ? { lat: user.lat, lng: user.lng, radiusKm: user.providerProfile?.radiusKm ?? 15 }
      : null;

  useEffect(() => {
    if (user?.accountKind === 'COMPANY') router.push('/account');
  }, [user]);

  useEffect(() => {
    api.categories().then(({ categories }) => setCategories(categories)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.listMissions({ status: 'OPEN', type: 'TASK', ...(categoryId ? { categoryId } : {}) }, token)
      .then(({ missions }) => { if (!cancelled) setMissions(missions); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [categoryId, token, user?.address, user?.providerProfile?.radiusKm]);

  const filteredMissions = missions
    .filter((m) => {
      if (posterFilter === 'INDIVIDUAL') return m.client?.accountKind !== 'COMPANY';
      if (posterFilter === 'COMPANY') return m.client?.accountKind === 'COMPANY';
      return true;
    })
    .filter((m) => !getOnly || m.isGetMission);

  // Lets the mission detail page's "Mission suivante" button step through
  // this same filtered/ordered list, whatever its origin (Jobber, Services34…).
  useEffect(() => {
    sessionStorage.setItem('jobber:missionListIds', JSON.stringify(filteredMissions.map((m) => m.id)));
    sessionStorage.setItem('jobber:missionListHref', '/missions');
  }, [filteredMissions]);

  return (
    <div>
      <span className="label-eyebrow text-moss">Missions</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Missions disponibles</h1>
      <p className="mt-1 text-sm text-slate-500">Parcourez les besoins publiés par les clients et proposez votre tarif horaire.</p>

      {user && (
        <div className="mt-4">
          <ZoneSummaryCard />
        </div>
      )}

      {user && user.accountKind !== 'COMPANY' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-moss px-4 py-3.5">
          <p>
            <span className="block font-bold text-ochre">Pour voir plus de missions, complétez votre profil !</span>
            <span className="mt-0.5 block text-sm font-medium text-white">
              Sont affichées uniquement les missions qui correspondent à vos capacités.
            </span>
          </p>
          <Link href="/dashboard/profile" className="shrink-0 rounded-md bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-slate-100">
            Compléter mon profil
          </Link>
        </div>
      )}

      <div className="mt-4 rounded-lg bg-green-600 px-4 py-3.5">
        <p className="font-bold text-white">
          GET MISSION : mission déjà chiffrée, à prendre tout de suite si vous remplissez les conditions. Activez le
          GET Mission !
        </p>
      </div>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <label className="block max-w-xs grow">
          <span className="text-xs font-medium text-slate-500">Filtrer par catégorie</span>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-moss"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </label>

        <div className="flex rounded-md border border-slate-200 bg-white p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`rounded px-3 py-1.5 ${view === 'list' ? 'bg-moss text-paper' : 'text-slate-500 hover:text-ink'}`}
          >
            Vue liste
          </button>
          <button
            type="button"
            onClick={() => setView('map')}
            className={`rounded px-3 py-1.5 ${view === 'map' ? 'bg-moss text-paper' : 'text-slate-500 hover:text-ink'}`}
          >
            Vue carte
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex rounded-md border border-slate-200 bg-white p-1 text-sm font-medium">
          {[
            ['ALL', 'Tout afficher'],
            ['INDIVIDUAL', 'Particuliers'],
            ['COMPANY', 'Pro / Entreprises & Corporate'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPosterFilter(value)}
              className={`rounded px-3 py-1.5 ${posterFilter === value ? 'bg-moss text-paper' : 'text-slate-500 hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium text-ink">
          GET Mission uniquement
          <button
            type="button"
            role="switch"
            aria-checked={getOnly}
            onClick={() => setGetOnly((v) => !v)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${getOnly ? 'bg-green-600' : 'bg-slate-300'}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${getOnly ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </label>
      </div>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && view === 'list' && filteredMissions.length === 0 && (
        <p className="mt-6 text-slate-400">Aucune mission ne correspond à ces filtres.</p>
      )}

      {!loading && view === 'list' && filteredMissions.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMissions.map((mission) => <MissionCard key={mission.id} mission={mission} />)}
        </div>
      )}

      {!loading && view === 'map' && <MissionsMap missions={filteredMissions} providerZone={providerZone} />}
    </div>
  );
}
