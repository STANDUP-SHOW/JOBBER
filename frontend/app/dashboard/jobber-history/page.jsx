'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function JobberHistoryPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
    else if (user?.accountKind === 'COMPANY') router.push('/account');
  }, [authLoading, user]);

  useEffect(() => {
    if (!token || !user) return;
    setLoading(true);
    api.myBookings(token)
      .then(({ bookings }) => setBookings(bookings.filter((b) => b.providerId === user.id && b.payment?.status === 'RELEASED')))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm text-slate-400 hover:text-moss">← Mon compte</Link>
      <span className="mt-4 block label-eyebrow text-moss">Espace Jobber</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Historique de missions</h1>
      <p className="mt-1 text-sm text-slate-500">Missions que vous avez réalisées et payées.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && bookings.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-500">Aucune mission réalisée pour le moment.</p>
          <Link href="/missions" className="mt-4 inline-block rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark">
            Parcourir les missions
          </Link>
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
              {b.hours} h × {b.hourlyRate} €/h · {new Date(b.scheduledDate).toLocaleDateString('fr-FR')}
            </div>
            <div className="mt-1 text-sm text-ink">Vous avez touché <strong>{b.payment.providerPayout} €</strong> (frais {b.payment.providerFee} €)</div>
            {b.review && <p className="mt-2 text-xs text-slate-400">Avis reçu : {'⭐'.repeat(b.review.rating)}{b.review.comment && ` — "${b.review.comment}"`}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
