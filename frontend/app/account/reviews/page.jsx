'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import StarRating from '../../../components/StarRating';

export default function MyReviewsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.userReviews(user.id)
      .then(({ reviews }) => setReviews(reviews))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm text-slate-400 hover:text-moss">← Mon compte</Link>
      <span className="mt-4 block label-eyebrow text-moss">Espace Jobber</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Mes évaluations</h1>

      {reviews.length > 0 && (
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
          <StarRating value={avg} size={14} />
          <span>{avg.toFixed(1)} sur {reviews.length} avis</span>
        </div>
      )}

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && reviews.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-500">Vous n'avez pas encore reçu d'avis.</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">{r.author?.firstName || 'Client'}</span>
              <StarRating value={r.rating} size={14} />
            </div>
            {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
            <div className="mt-1 text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('fr-FR')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
