'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function InvoicesPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (!token) return;
    api.myBookings(token).then(({ bookings }) => setBookings(bookings)).catch((e) => setError(e.message));
  }, [token]);

  if (!user) return null;

  const invoiced = bookings.filter((b) => b.clientId === user.id && b.payment?.status === 'RELEASED');

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/account" className="text-sm font-medium text-moss">← Mon compte</Link>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Mes factures</h1>
      <p className="mt-1 text-sm text-slate-500">Une facture est générée pour chaque prestation payée et versée au prestataire.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-6 space-y-3">
        {invoiced.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            Aucune facture pour le moment.
          </div>
        )}
        {invoiced.map((b) => (
          <Link
            key={b.id}
            href={`/account/invoices/${b.id}`}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 hover:border-moss"
          >
            <div>
              <div className="font-display text-base font-medium text-ink">{b.mission?.title}</div>
              <div className="text-xs text-slate-400">{new Date(b.scheduledDate).toLocaleDateString('fr-FR')}</div>
            </div>
            <div className="text-right">
              <div className="font-display text-base font-semibold text-ink">{b.payment.amount.toFixed(2)} €</div>
              <div className="text-xs text-moss">Voir la facture →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
