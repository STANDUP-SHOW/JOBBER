'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import PaymentModal from '../../../components/PaymentModal';
import DistanceBadge from '../../../components/DistanceBadge';
import CountdownToStart from '../../../components/CountdownToStart';
import { haversineDistanceKm } from '../../../lib/geo';

const ONGOING_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'AWAITING_VALIDATION'];

const BOOKING_STATUS_LABELS = {
  SCHEDULED: 'Programmée',
  IN_PROGRESS: 'En cours',
  AWAITING_VALIDATION: 'En attente de validation',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  DISPUTED: 'Litige',
};

function distanceTo(user, mission) {
  if (user?.lat == null || user?.lng == null || mission?.lat == null || mission?.lng == null) return null;
  return Math.round(haversineDistanceKm(user.lat, user.lng, mission.lat, mission.lng) * 10) / 10;
}

export default function ComptesMissionsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('open');
  const [bookings, setBookings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [openMissions, setOpenMissions] = useState([]);
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
      const [{ bookings }, { offers }, { missions }] = await Promise.all([
        api.myBookings(token), api.receivedOffers(token), api.myMissions(user.id, token),
      ]);
      setBookings(bookings.filter((b) => b.clientId === user.id && ONGOING_STATUSES.includes(b.status)));
      setOffers(offers);
      // "Mes demandes" — missions still OPEN (published, searching for a
      // jobber, no offer accepted yet). Once an offer is accepted the
      // mission moves to the "ongoing" tab via its Booking instead, so
      // filtering to OPEN here avoids showing the same mission twice.
      setOpenMissions(missions.filter((m) => m.status === 'OPEN'));
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

  async function contactAgency(mission) {
    if (!mission?.corporateAgencyId) return;
    setBusyId(`contact-${mission.id}`); setError('');
    try {
      const { conversation } = await api.startConversation({ missionId: mission.id, providerId: mission.corporateAgencyId }, token);
      router.push(`/messages/${conversation.id}`);
    } catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/compte" className="text-sm text-slate-400 hover:text-brand">← Mon compte</Link>
      <span className="mt-4 block text-sm font-semibold uppercase tracking-wide text-brand">Suivi de missions</span>
      <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Missions en cours et offres reçues</h1>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <TabButton active={tab === 'open'} onClick={() => setTab('open')}>
          Mes demandes {openMissions.length > 0 && `(${openMissions.length})`}
        </TabButton>
        <TabButton active={tab === 'ongoing'} onClick={() => setTab('ongoing')}>
          Missions en cours {bookings.length > 0 && `(${bookings.length})`}
        </TabButton>
        <TabButton active={tab === 'offers'} onClick={() => setTab('offers')}>
          Offres reçues {offers.length > 0 && `(${offers.length})`}
        </TabButton>
      </div>

      {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && tab === 'open' && (
        <div className="mt-6 space-y-3">
          {openMissions.length === 0 && <EmptyState text="Aucune demande en attente d'offre pour le moment." />}
          {openMissions.map((m) => (
            <div key={m.id} className="relative rounded-lg border border-slate-200 bg-white p-4">
              <DistanceBadge distanceKm={distanceTo(user, m)} />
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand/10 text-xl">
                  {m.category?.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/compte/missions/${m.id}`} className="truncate font-display text-base font-semibold text-ink hover:text-brand hover:underline">
                    {m.title}
                  </Link>
                  <div className="mt-0.5 truncate text-sm text-slate-400">{m.address}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {m._count?.offers > 0
                      ? `${m._count.offers} offre${m._count.offers > 1 ? 's' : ''} reçue${m._count.offers > 1 ? 's' : ''}`
                      : 'En attente de candidatures de jobbers'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'ongoing' && (
        <div className="mt-6 space-y-3">
          {bookings.length === 0 && <EmptyState text="Aucune mission en cours pour le moment." />}
          {bookings.map((b) => (
            <div key={b.id} className="relative rounded-lg border border-slate-200 bg-white p-4">
              <DistanceBadge distanceKm={distanceTo(user, b.mission)} />
              <div className="flex items-center justify-between gap-2">
                <Link href={`/compte/missions/${b.mission?.id}`} className="font-display text-base font-semibold text-ink hover:text-brand hover:underline">
                  {b.mission?.title}
                </Link>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{BOOKING_STATUS_LABELS[b.status] || b.status}</span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {b.hours} h × {b.hourlyRate} €/h = <strong>{b.totalAmount} €</strong> · {new Date(b.scheduledDate).toLocaleDateString('fr-FR')}
              </div>
              {b.status === 'SCHEDULED' && <div className="mt-1"><CountdownToStart date={b.scheduledDate} /></div>}
              <div className="mt-3 flex flex-wrap gap-2">
                {b.payment?.status === 'REQUIRES_PAYMENT' && (
                  <button
                    onClick={() => setPayingBooking(b)}
                    className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Payer maintenant ({b.payment.amount} €)
                  </button>
                )}
                <button
                  disabled={busyId === `contact-${b.mission?.id}`}
                  onClick={() => contactAgency(b.mission)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:border-brand disabled:opacity-60"
                >
                  💬 Contacter l'agence
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && tab === 'offers' && (
        <div className="mt-6 space-y-3">
          {offers.length === 0 && <EmptyState text="Aucune offre reçue pour le moment." />}
          {offers.map((o) => (
            <div key={o.id} className="relative rounded-lg border border-slate-200 bg-white p-4">
              <DistanceBadge distanceKm={distanceTo(user, o.mission)} />
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand/10 text-xl">
                  {o.mission.category?.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/compte/missions/${o.mission.id}`} className="truncate font-display text-base font-semibold text-ink hover:text-brand hover:underline">
                      {o.mission.title}
                    </Link>
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
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  disabled={busyId === `contact-${o.mission.id}`}
                  onClick={() => contactAgency(o.mission)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:border-brand disabled:opacity-60"
                >
                  💬 Contacter l'agence
                </button>
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
