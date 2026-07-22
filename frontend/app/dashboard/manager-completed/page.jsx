'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import StarRating from '../../../components/StarRating';

export default function ManagerCompletedPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  async function refresh() {
    if (!token) return;
    setLoading(true);
    try {
      const { bookings } = await api.myBookings(token);
      setBookings(bookings.filter((b) => b.clientId === user.id && b.payment?.status === 'RELEASED'));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (user) refresh().catch((e) => setError(e.message)); }, [token, user]);

  async function submitReview(bookingId) {
    const draft = reviewDraft[bookingId] || { rating: 5, comment: '' };
    setBusyId(bookingId); setError('');
    try { await api.submitReview({ bookingId, rating: draft.rating, comment: draft.comment }, token); await refresh(); }
    catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm text-slate-400 hover:text-moss">← Mon compte</Link>
      <span className="mt-4 block label-eyebrow text-moss">Espace Manager</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Missions terminées</h1>
      <p className="mt-1 text-sm text-slate-500">Missions closes et payées.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && bookings.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-500">Aucune mission terminée pour le moment.</p>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="font-display text-lg font-medium text-ink">{b.mission?.title}</div>
              <span className="rounded-full bg-moss-light px-3 py-1 text-xs font-medium text-moss-dark">Terminée</span>
            </div>
            <div className="text-sm text-slate-500">
              {b.hours} h × {b.hourlyRate} €/h = <strong>{b.totalAmount} €</strong> · {new Date(b.scheduledDate).toLocaleDateString('fr-FR')}
            </div>

            {!b.review && (
              <div className="mt-4 rounded-md bg-slate-50 p-4">
                <div className="mb-2 text-sm font-medium text-ink">Laisser un avis</div>
                <StarRating
                  value={reviewDraft[b.id]?.rating ?? 5}
                  onChange={(rating) => setReviewDraft({ ...reviewDraft, [b.id]: { ...reviewDraft[b.id], rating } })}
                />
                <textarea
                  rows={2}
                  placeholder="Votre commentaire (optionnel)"
                  value={reviewDraft[b.id]?.comment || ''}
                  onChange={(e) => setReviewDraft({ ...reviewDraft, [b.id]: { ...reviewDraft[b.id], comment: e.target.value } })}
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
                />
                <button
                  disabled={busyId === b.id}
                  onClick={() => submitReview(b.id)}
                  className="mt-2 rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark disabled:opacity-60"
                >
                  {busyId === b.id ? '…' : "Publier l'avis"}
                </button>
              </div>
            )}
            {b.review && <p className="mt-3 text-xs text-moss-dark">Avis déjà publié — merci !</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
