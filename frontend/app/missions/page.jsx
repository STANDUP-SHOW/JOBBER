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
          <p className="text-sm font-medium text-ochre">
            Ici n'apparaissent que les missions correspondant à vos compétences. Si vous voulez voir plus de
            missions, cochez plus de cases dans votre profil jobber.
          </p>
          <Link href="/dashboard/profile" className="shrink-0 rounded-md bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-slate-100">
            Compléter mon profil
          </Link>
        </div>
      )}

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

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && view === 'list' && missions.length === 0 && (
        <p className="mt-6 text-slate-400">Aucune mission ouverte pour le moment.</p>
      )}

      {!loading && view === 'list' && missions.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {missions.map((mission) => <MissionCard key={mission.id} mission={mission} />)}
        </div>
      )}

      {!loading && view === 'map' && <MissionsMap missions={missions} providerZone={providerZone} />}
    </div>
  );
}
