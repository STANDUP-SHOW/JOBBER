'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import MissionCard from '../../components/MissionCard';

export default function LessonsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    api.listMissions({ status: 'OPEN', type: 'LESSON', ...(categoryId ? { categoryId } : {}) }, token)
      .then(({ missions }) => { if (!cancelled) setLessons(missions); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [categoryId, token]);

  return (
    <div>
      <span className="label-eyebrow text-moss">Apprendre</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Leçons proposées</h1>
      <p className="mt-1 text-sm text-slate-500">
        Des jobbers viennent chez vous pour vous apprendre, en pratique : jardinage, ménage, électricité, plomberie, et plus.
      </p>

      <div className="mt-4">
        <Link href="/missions/new?type=lesson" className="rounded-md bg-moss px-5 py-3 font-medium text-paper hover:bg-moss-dark">
          Demander un cours
        </Link>
      </div>

      <div className="mt-6">
        <label className="block max-w-xs">
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
      </div>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && lessons.length === 0 && (
        <p className="mt-6 text-slate-400">Aucune demande de cours ouverte pour le moment.</p>
      )}

      {!loading && lessons.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => <MissionCard key={lesson.id} mission={lesson} />)}
        </div>
      )}
    </div>
  );
}
