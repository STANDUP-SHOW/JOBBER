'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import StarRating from '../../../components/StarRating';

export default function FavoritesPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  async function refresh() {
    if (!token) return;
    setLoading(true);
    try { const { favorites } = await api.myFavorites(token); setFavorites(favorites); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, [token]);

  async function remove(providerId) {
    setBusyId(providerId);
    try { await api.removeFavorite(providerId, token); await refresh(); }
    catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm text-slate-400 hover:text-moss">← Mon compte</Link>
      <span className="mt-4 block label-eyebrow text-moss">Espace Manager</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Mes jobbers favoris</h1>
      <p className="mt-1 text-sm text-slate-500">Les prestataires que vous souhaitez recontacter facilement.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && favorites.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-500">Vous n'avez pas encore de jobber favori.</p>
          <Link href="/providers" className="mt-4 inline-block rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark">
            Parcourir les prestataires
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {favorites.map((f) => {
          const p = f.provider;
          const profile = p.providerProfile;
          return (
            <div key={f.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
              <Link href={`/providers/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-moss-light font-display text-lg text-moss-dark">
                  {p.firstName?.[0]}{p.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-display text-base font-semibold text-ink">{p.firstName} {p.lastName?.[0]}.</div>
                  {profile && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <StarRating value={profile.ratingAverage} size={12} />
                      <span>{profile.ratingAverage.toFixed(1)} ({profile.ratingCount})</span>
                    </div>
                  )}
                  {profile?.categories?.length > 0 && (
                    <div className="mt-0.5 truncate text-xs text-slate-400">
                      {profile.categories.map((c) => c.category.name).join(' · ')}
                    </div>
                  )}
                </div>
              </Link>
              <button
                disabled={busyId === p.id}
                onClick={() => remove(p.id)}
                className="shrink-0 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-clay hover:text-clay disabled:opacity-60"
              >
                Retirer
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
