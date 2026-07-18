'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function TeachLessonsPage() {
  const { user, token, login, loading: authLoading } = useAuth();
  const router = useRouter();

  const [offersLessons, setOffersLessons] = useState(false);
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (user?.providerProfile) setOffersLessons(user.providerProfile.offersLessons ?? false);
  }, [user]);

  const categories = user?.providerProfile?.categories || [];

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSaved(false);

    if (offersLessons && !declarationAccepted) {
      setError('Vous devez cocher la déclaration sur l\'honneur pour proposer des cours.');
      return;
    }

    setLoading(true);
    try {
      await api.updateProviderProfile({ offersLessons }, token);
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
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Donner des cours</h1>
      <p className="mt-1 text-sm text-slate-500">
        Proposez des cours pratiques aux clients qui veulent apprendre, dans les catégories de votre profil jobber.
      </p>

      {categories.length === 0 ? (
        <p className="mt-6 rounded-md bg-ochre-light px-4 py-3 text-sm text-ochre-dark">
          Vous devez d'abord sélectionner au moins une catégorie sur votre{' '}
          <Link href="/dashboard/profile" className="font-medium underline">profil jobber</Link> avant de pouvoir proposer des cours.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <span className="text-sm font-semibold text-ink">Vos catégories</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c.id} className="rounded-full bg-moss-light px-3 py-1 text-sm text-moss-dark">
                  {c.category.icon} {c.category.name}
                </span>
              ))}
            </div>
          </div>

          <label className={`flex items-start gap-3 rounded-lg border p-4 text-base text-ink ${offersLessons ? 'border-moss' : 'border-slate-200'}`}>
            <input
              type="checkbox"
              checked={offersLessons}
              onChange={(e) => setOffersLessons(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 accent-moss"
            />
            <span>
              <span className="font-semibold">Proposer des cours</span>
              <span className="mt-0.5 block text-sm text-slate-500">
                J'accepte de donner des cours pratiques aux clients dans mes catégories ci-dessus.
              </span>
            </span>
          </label>

          {offersLessons && (
            <label className="flex items-start gap-3 rounded-lg border border-ochre bg-ochre-light p-4 text-base text-ink">
              <input
                type="checkbox"
                checked={declarationAccepted}
                onChange={(e) => setDeclarationAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 accent-moss"
              />
              <span>
                <span className="font-semibold">Déclaration sur l'honneur</span>
                <span className="mt-0.5 block text-sm text-ochre-dark">
                  Je déclare sur l'honneur disposer d'un titre professionnel dans la ou les catégories que j'enseigne,
                  ou justifier de plus de 3 ans d'expérience dans ce domaine.
                </span>
              </span>
            </label>
          )}

          {error && <p className="rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
          {saved && <p className="rounded-md bg-moss-light px-3 py-2 text-sm text-moss-dark">Mis à jour.</p>}

          <button disabled={loading} className="w-full rounded-md bg-moss py-3.5 text-base font-semibold text-paper hover:bg-moss-dark disabled:opacity-60">
            {loading ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </form>
      )}
    </div>
  );
}
