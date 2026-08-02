'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import PaymentModal from '../../../components/PaymentModal';

const ONGOING_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'AWAITING_VALIDATION'];

export default function ComptesMissionsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('ongoing');
  const [bookings, setBookings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [payingBooking, setPayingBooking] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login?next=/compte/missions');
  }, [authLoading, user, router]);

  async function refresh() {
    if (!token || !user) return;
    setLoading(true);
    try {
      const [{ bookings }, { offers }] = await Promise.all([api.myBookings(token), api.receivedOffers(token)]);
      setBookings(bookings.filter((b) => b.clientId === user.id && ONGOING_STATUSES.includes(b.status)));
      setOffers(offers);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (user) refresh().catch((e) => setError(e.message)); }, [token, user]);

  async function accept(offerId) {
    setBusyId(offerId); setError('');
    try { await api.acceptOffer(offerId, undefined, token); await refresh(); setTab('ongoing'); }
    catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/compte" className="text-sm text-slate-400 hover:text-brand">← Mon compte</Link>
      <span className="mt-4 block text-sm font-semibold uppercase tracking-wide text-brand">Suivi de missions</span>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Missions en cours et offres reçues</h1>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <TabButton active={tab === 'ongoing'} onClick={() => setTab('ongoing')}>
          Missions en cours {bookings.length > 0 && `(${bookings.length})`}
        </TabButton>
        <TabButton active={tab === 'offers'} onClick={() => setTab('offers')}>
          Offres reçues {offers.length > 0 && `(${offers.length})`}
        </TabButton>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && tab === 'ongoing' && (
        <div className="mt-6 space-y-3">
          {bookings.length === 0 && <EmptyState text="Aucune mission en cours pour le moment." />}
          {bookings.map((b) => (
            <div key={b.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div className="font-display text-base font-semibold text-ink">{b.mission?.title}</div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{b.status}</span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {b.hours} h × {b.hourlyRate} €/h = <strong>{b.totalAmount} €</strong> · {new Date(b.scheduledDate).toLocaleDateString('fr-FR')}
              </div>
              {b.payment?.status === 'REQUIRES_PAYMENT' && (
                <button
                  onClick={() => setPayingBooking(b)}
                  className="mt-3 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Payer maintenant ({b.payment.amount} €)
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'offers' && (
        <div className="mt-6 space-y-3">
          {offers.length === 0 && <EmptyState text="Aucune offre reçue pour le moment." />}
          {offers.map((o) => (
            <div key={o.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand/10 text-xl">
                  {o.mission.category?.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate font-display text-base font-semibold text-ink">{o.mission.title}</h3>
                    <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-ink">{o.hourlyRate} €/h</span>
                  </div>
                  <div className="mt-0.5 truncate text-sm text-slate-400">{o.mission.address}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    Proposée par <strong>{o.provider.firstName} {o.provider.lastName}</strong>
                    {o.provider.providerProfile?.ratingCount > 0 && (
                      <> · ⭐ {o.provider.providerProfile.ratingAverage.toFixed(1)} ({o.provider.providerProfile.ratingCount})</>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3">
                <button
                  disabled={busyId === o.id}
                  onClick={() => accept(o.id)}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  {busyId === o.id ? '…' : 'Accepter et payer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {payingBooking && (
        <PaymentModal
          booking={payingBooking}
          token={token}
          onClose={() => setPayingBooking(null)}
          onPaid={() => { setPayingBooking(null); refresh(); }}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${active ? 'border-brand text-brand' : 'border-transparent text-slate-400 hover:text-ink'}`}
    >
      {children}
    </button>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
      <p className="text-slate-500">{text}</p>
    </div>
  );
}
