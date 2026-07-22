'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

const ONGOING_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'];

export default function ManagerMissionsPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('ongoing');
  const [bookings, setBookings] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  async function refresh() {
    if (!token) return;
    setLoading(true);
    try {
      const [{ bookings }, { offers }] = await Promise.all([api.myBookings(token), api.receivedOffers(token)]);
      setBookings(bookings.filter((b) => b.clientId === user.id && ONGOING_STATUSES.includes(b.status) && b.payment?.status !== 'RELEASED'));
      setOffers(offers);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (user) refresh().catch((e) => setError(e.message)); }, [token, user]);

  async function accept(offerId) {
    setBusyId(offerId); setError('');
    try { await api.acceptOffer(offerId, token); await refresh(); }
    catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/account" className="text-sm text-slate-400 hover:text-moss">← Mon compte</Link>
      <span className="mt-4 block label-eyebrow text-moss">Espace Manager</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Suivi de missions</h1>

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        <TabButton active={tab === 'ongoing'} onClick={() => setTab('ongoing')}>
          Missions en cours {bookings.length > 0 && `(${bookings.length})`}
        </TabButton>
        <TabButton active={tab === 'offers'} onClick={() => setTab('offers')}>
          Offres reçues {offers.length > 0 && `(${offers.length})`}
        </TabButton>
      </div>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && tab === 'ongoing' && (
        <div className="mt-6 space-y-3">
          {bookings.length === 0 && <EmptyState text="Aucune mission en cours pour le moment." />}
          {bookings.map((b) => (
            <Link key={b.id} href="/dashboard" className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-moss hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="font-display text-base font-semibold text-ink">{b.mission?.title}</div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{b.status}</span>
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {b.hours} h × {b.hourlyRate} €/h = <strong>{b.totalAmount} €</strong> · {new Date(b.scheduledDate).toLocaleDateString('fr-FR')}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && tab === 'offers' && (
        <div className="mt-6 space-y-3">
          {offers.length === 0 && <EmptyState text="Aucune offre reçue pour le moment." />}
          {offers.map((o) => (
            <div key={o.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-moss-light text-xl">
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
                    {o.provider.providerProfile?.completedMissions > 0 && ` · ${o.provider.providerProfile.completedMissions} missions réalisées`}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                <Link href={`/missions/${o.mission.id}`} className="text-sm text-slate-500 hover:text-moss">Voir la mission</Link>
                <button
                  disabled={busyId === o.id}
                  onClick={() => accept(o.id)}
                  className="rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark disabled:opacity-60"
                >
                  {busyId === o.id ? '…' : 'Accepter'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${active ? 'border-moss text-moss' : 'border-transparent text-slate-400 hover:text-ink'}`}
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
