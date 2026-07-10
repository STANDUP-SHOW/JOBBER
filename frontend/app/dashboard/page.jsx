'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';
import StarRating from '../../components/StarRating';

export default function DashboardPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({}); // bookingId -> { rating, comment }

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  async function refresh() {
    if (!token) return;
    const { bookings } = await api.myBookings(token);
    setBookings(bookings);
  }

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, [token]);

  async function act(id, fn) {
    setBusyId(id); setError('');
    try { await fn(); await refresh(); }
    catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  }

  async function submitReview(bookingId) {
    const draft = reviewDraft[bookingId] || { rating: 5, comment: '' };
    await act(bookingId, () => api.submitReview({ bookingId, rating: draft.rating, comment: draft.comment }, token));
  }

  if (!user) return null;

  return (
    <div>
      <span className="label-eyebrow text-moss">Tableau de bord</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Bonjour {user.firstName}</h1>
      <p className="mt-1 text-sm text-slate-500">Rôle : {user.role === 'PROVIDER' ? 'Prestataire' : 'Client'}</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-8 space-y-4">
        {bookings.length === 0 && <EmptyState role={user.role} />}

        {bookings.map((b) => {
          const isClient = b.clientId === user.id;
          const busy = busyId === b.id;
          return (
            <div key={b.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-lg font-medium text-ink">{b.mission?.title}</div>
                  <div className="text-sm text-slate-500">
                    {b.hours} h × {b.hourlyRate} €/h = <strong>{b.totalAmount} €</strong> · {new Date(b.scheduledDate).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{b.status}</span>
              </div>

              {b.payment && (
                <div className="mt-2 text-xs text-slate-400">
                  Paiement : {b.payment.status} {isClient && ` — prestataire touche ${b.payment.providerPayout} € (frais plateforme ${b.payment.platformFee} €)`}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {isClient && b.status === 'SCHEDULED' && (
                  <ActionButton busy={busy} onClick={() => act(b.id, () => api.startBooking(b.id, token))}>Démarrer la mission</ActionButton>
                )}
                {!isClient && b.status === 'SCHEDULED' && (
                  <ActionButton busy={busy} onClick={() => act(b.id, () => api.startBooking(b.id, token))}>Marquer comme démarrée</ActionButton>
                )}
                {isClient && b.status === 'IN_PROGRESS' && (
                  <ActionButton busy={busy} onClick={() => act(b.id, () => api.completeBooking(b.id, token))}>Valider la mission terminée</ActionButton>
                )}
                {isClient && b.status === 'COMPLETED' && b.payment?.status !== 'RELEASED' && (
                  <ActionButton busy={busy} variant="ochre" onClick={() => act(b.id, () => api.releasePayment(b.id, token))}>
                    Verser le prestataire ({b.totalAmount} €)
                  </ActionButton>
                )}
              </div>

              {b.status === 'COMPLETED' && b.payment?.status === 'RELEASED' && !b.review && (
                <div className="mt-4 rounded-md bg-slate-50 p-4">
                  <div className="text-sm font-medium text-ink mb-2">Laisser un avis</div>
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
                  <ActionButton busy={busy} onClick={() => submitReview(b.id)}>Publier l'avis</ActionButton>
                </div>
              )}
              {b.review && <p className="mt-3 text-xs text-moss-dark">Avis déjà publié — merci !</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ role }) {
  if (role === 'PROVIDER') {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
        <p className="text-slate-500">Vous n'avez pas encore de réservation.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/missions" className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark">
            Parcourir les missions
          </Link>
          <Link href="/dashboard/profile" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:border-moss hover:text-moss">
            Compléter mon profil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
      <p className="text-slate-500">Vous n'avez pas encore de réservation.</p>
      <div className="mt-4 flex justify-center">
        <Link href="/missions/new" className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark">
          Publier un besoin
        </Link>
      </div>
    </div>
  );
}

function ActionButton({ children, onClick, busy, variant = 'ink' }) {
  const styles = variant === 'ochre'
    ? 'bg-ochre text-ink hover:bg-ochre-dark'
    : 'bg-ink text-paper hover:bg-moss-dark';
  return (
    <button disabled={busy} onClick={onClick} className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${styles}`}>
      {busy ? '…' : children}
    </button>
  );
}
