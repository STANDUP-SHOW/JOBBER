'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

const MissionsMap = dynamic(() => import('../../../components/MissionsMap'), {
  ssr: false,
  loading: () => <p className="mt-6 text-slate-400">Chargement de la carte…</p>,
});

// Bookings still to work: a mission GET-claimed or an accepted offer both
// become a Booking (see backend), so this list already covers both —
// nothing GET-specific to filter for separately.
const ACTIVE_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'AWAITING_VALIDATION'];

const STATUS_LABELS = {
  SCHEDULED: 'Programmée',
  IN_PROGRESS: 'En cours',
  AWAITING_VALIDATION: 'En attente de validation',
};

function CountdownToStart({ date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const diffMs = new Date(date).getTime() - now;
  if (diffMs <= 0) return <span className="text-xs font-medium text-ochre-dark">Peut démarrer</span>;
  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days > 0) parts.push(`${days} j`);
  if (days > 0 || hours > 0) parts.push(`${hours} h`);
  parts.push(`${minutes} min`);
  return <span className="text-xs font-medium text-slate-500">Démarre dans {parts.join(' ')}</span>;
}

function ActionButton({ children, onClick, busy, variant = 'moss' }) {
  const styles = variant === 'ochre' ? 'bg-ochre text-ink hover:bg-ochre-dark' : 'bg-moss text-paper hover:bg-moss-dark';
  return (
    <button disabled={busy} onClick={onClick} className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${styles}`}>
      {busy ? '…' : children}
    </button>
  );
}

// One-way "add to my calendar" link — no OAuth/consent flow required.
// A full two-way Google Calendar sync would need a Google Cloud project,
// OAuth credentials and server-side token storage, which isn't set up in
// this codebase.
function googleCalendarUrl(booking) {
  const start = new Date(booking.scheduledDate);
  const end = new Date(start.getTime() + (booking.hours || 1) * 3600 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: booking.mission?.title || 'Mission Jobber+',
    dates: `${fmt(start)}/${fmt(end)}`,
    details: booking.mission?.description || '',
    location: booking.mission?.address || '',
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

function BookingCard({ booking, user, busy, onAct }) {
  const isClient = booking.clientId === user.id;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href={`/missions/${booking.mission?.id}`} className="font-display text-base font-medium text-ink hover:text-moss hover:underline">
            {booking.mission?.title}
          </Link>
          <div className="mt-0.5 text-sm text-slate-500">
            {new Date(booking.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à{' '}
            {new Date(booking.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · {booking.hours} h
          </div>
          {booking.status === 'SCHEDULED' && <div className="mt-1"><CountdownToStart date={booking.scheduledDate} /></div>}
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {STATUS_LABELS[booking.status] || booking.status}
        </span>
      </div>

      {booking.status === 'AWAITING_VALIDATION' && (
        <p className="mt-3 rounded-md bg-ochre-light px-3 py-2 text-sm text-ochre-dark">
          {isClient ? 'Le jobber indique que la mission est terminée — merci de valider.' : 'En attente de la validation du client.'}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {isClient && booking.status === 'SCHEDULED' && (
          <ActionButton busy={busy} onClick={() => onAct(booking.id, (t) => api.startBooking(booking.id, t))}>Démarrer la mission</ActionButton>
        )}
        {!isClient && booking.status === 'SCHEDULED' && (
          <ActionButton busy={busy} onClick={() => onAct(booking.id, (t) => api.startBooking(booking.id, t))}>Marquer comme démarrée</ActionButton>
        )}
        {!isClient && booking.status === 'IN_PROGRESS' && (
          <ActionButton busy={busy} onClick={() => onAct(booking.id, (t) => api.markBookingDone(booking.id, t))}>Mission terminée</ActionButton>
        )}
        {isClient && booking.status === 'AWAITING_VALIDATION' && (
          <ActionButton busy={busy} variant="ochre" onClick={() => onAct(booking.id, (t) => api.completeBooking(booking.id, t))}>Valider la mission terminée</ActionButton>
        )}
        <a
          href={googleCalendarUrl(booking)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-ink hover:border-moss hover:text-moss"
        >
          📅 Ajouter à Google Agenda
        </a>
      </div>
    </div>
  );
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function PlanningView({ bookings }) {
  const [mode, setMode] = useState('month'); // month | week | day
  const [cursor, setCursor] = useState(() => new Date());

  function shift(delta) {
    setCursor((c) => {
      const d = new Date(c);
      if (mode === 'month') d.setMonth(d.getMonth() + delta);
      else if (mode === 'week') d.setDate(d.getDate() + delta * 7);
      else d.setDate(d.getDate() + delta);
      return d;
    });
  }

  const bookingsByDay = (day) => bookings.filter((b) => sameDay(new Date(b.scheduledDate), day));

  let periodLabel = '';
  let content;

  if (mode === 'month') {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    periodLabel = capitalize(monthStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
    const gridStart = startOfWeek(monthStart);
    const days = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    content = (
      <div className="grid grid-cols-7 gap-1.5">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-slate-400">{d}</div>
        ))}
        {days.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const dayBookings = bookingsByDay(d);
          return (
            <div
              key={i}
              className={`min-h-[80px] rounded-md border p-1.5 text-left ${inMonth ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'}`}
            >
              <div className={`text-xs ${inMonth ? 'text-ink' : 'text-slate-300'}`}>{d.getDate()}</div>
              <div className="mt-1 space-y-1">
                {dayBookings.map((b) => (
                  <Link
                    key={b.id}
                    href={`/missions/${b.mission?.id}`}
                    className="block truncate rounded bg-moss-light px-1.5 py-0.5 text-[11px] font-medium text-moss-dark hover:bg-moss hover:text-white"
                    title={b.mission?.title}
                  >
                    {b.mission?.title}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  } else if (mode === 'week') {
    const weekStart = startOfWeek(cursor);
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d;
    });
    const weekEnd = days[6];
    periodLabel = `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    content = (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
        {days.map((d, i) => (
          <div key={i} className="rounded-md border border-slate-200 bg-white p-2">
            <div className="text-xs font-semibold text-ink">{capitalize(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }))}</div>
            <div className="mt-1.5 space-y-1">
              {bookingsByDay(d).map((b) => (
                <Link
                  key={b.id}
                  href={`/missions/${b.mission?.id}`}
                  className="block truncate rounded bg-moss-light px-1.5 py-1 text-xs font-medium text-moss-dark hover:bg-moss hover:text-white"
                >
                  {new Date(b.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} {b.mission?.title}
                </Link>
              ))}
              {bookingsByDay(d).length === 0 && <div className="text-[11px] text-slate-300">—</div>}
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    periodLabel = capitalize(cursor.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
    const dayBookings = bookingsByDay(cursor).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));
    content = (
      <div className="space-y-2">
        {dayBookings.length === 0 && <p className="text-sm text-slate-400">Aucune mission ce jour-là.</p>}
        {dayBookings.map((b) => (
          <Link
            key={b.id}
            href={`/missions/${b.mission?.id}`}
            className="flex items-center gap-3 rounded-md border border-slate-200 bg-white p-3 hover:border-moss"
          >
            <span className="shrink-0 font-display text-sm font-semibold text-moss-dark">
              {new Date(b.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-sm text-ink">{b.mission?.title}</span>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shift(-1)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm hover:border-moss">←</button>
          <span className="font-display text-sm font-semibold text-ink">{periodLabel}</span>
          <button type="button" onClick={() => shift(1)} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-sm hover:border-moss">→</button>
          <button type="button" onClick={() => setCursor(new Date())} className="text-xs font-medium text-moss hover:underline">Aujourd'hui</button>
        </div>
        <div className="flex rounded-md border border-slate-200 bg-white p-1 text-sm font-medium">
          {[['month', 'Mois'], ['week', 'Semaine'], ['day', 'Jour']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded px-3 py-1.5 ${mode === value ? 'bg-moss text-paper' : 'text-slate-500 hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">{content}</div>
    </div>
  );
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export default function SchedulePage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [view, setView] = useState('list'); // list | map | planning

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  async function refresh() {
    if (!token) return;
    setLoading(true);
    try {
      const { bookings } = await api.myBookings(token);
      setBookings(bookings.filter((b) => ACTIVE_STATUSES.includes(b.status)));
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (user) refresh().catch((e) => setError(e.message)); }, [token, user]);

  async function act(id, fn) {
    setBusyId(id); setError('');
    try { await fn(token); await refresh(); }
    catch (err) { setError(err.message); }
    finally { setBusyId(null); }
  }

  const missionsForMap = useMemo(
    () => bookings.map((b) => b.mission).filter(Boolean),
    [bookings]
  );

  if (!user) return null;

  return (
    <div className="max-w-3xl">
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Missions à réaliser</h1>
      <p className="mt-1 text-sm text-slate-500">
        Vos missions GET Mission gagnées et offres acceptées, à venir ou en cours.
      </p>

      <div className="mt-4 flex rounded-md border border-slate-200 bg-white p-1 text-sm font-medium">
        {[['list', 'Vue liste'], ['map', 'Vue carte'], ['planning', 'Vue planning']].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setView(value)}
            className={`rounded px-3 py-1.5 ${view === value ? 'bg-moss text-paper' : 'text-slate-500 hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && bookings.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-500">Aucune mission à réaliser pour le moment.</p>
          <Link href="/missions" className="mt-4 inline-block rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark">
            Parcourir les missions
          </Link>
        </div>
      )}

      {!loading && bookings.length > 0 && view === 'list' && (
        <div className="mt-4 space-y-3">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} user={user} busy={busyId === b.id} onAct={act} />
          ))}
        </div>
      )}

      {!loading && bookings.length > 0 && view === 'map' && (
        <MissionsMap missions={missionsForMap} providerZone={null} />
      )}

      {!loading && bookings.length > 0 && view === 'planning' && <PlanningView bookings={bookings} />}
    </div>
  );
}
