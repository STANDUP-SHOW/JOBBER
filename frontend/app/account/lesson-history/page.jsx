'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function LessonHistoryPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [given, setGiven] = useState([]);
  const [taken, setTaken] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (!token || !user) return;
    setLoading(true);
    api.myBookings(token)
      .then(({ bookings }) => {
        const lessons = bookings.filter((b) => b.mission?.type === 'LESSON' && b.payment?.status === 'RELEASED');
        setGiven(lessons.filter((b) => b.providerId === user.id));
        setTaken(lessons.filter((b) => b.clientId === user.id));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm text-slate-400 hover:text-moss">← Mon compte</Link>
      <span className="mt-4 block label-eyebrow text-moss">Espace Formation</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Historique formation jobber</h1>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && (
        <>
          <section className="mt-6">
            <h2 className="font-display text-lg font-medium text-ink">Cours donnés</h2>
            {given.length === 0 && <p className="mt-2 text-sm text-slate-400">Aucun cours donné pour le moment.</p>}
            <div className="mt-3 space-y-3">
              {given.map((b) => <LessonCard key={b.id} b={b} />)}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-lg font-medium text-ink">Cours suivis</h2>
            {taken.length === 0 && <p className="mt-2 text-sm text-slate-400">Aucun cours suivi pour le moment.</p>}
            <div className="mt-3 space-y-3">
              {taken.map((b) => <LessonCard key={b.id} b={b} />)}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function LessonCard({ b }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="font-display text-base font-semibold text-ink">{b.mission?.title}</div>
      <div className="mt-1 text-sm text-slate-500">
        {b.hours} h × {b.hourlyRate} €/h = <strong>{b.totalAmount} €</strong> · {new Date(b.scheduledDate).toLocaleDateString('fr-FR')}
      </div>
    </div>
  );
}
