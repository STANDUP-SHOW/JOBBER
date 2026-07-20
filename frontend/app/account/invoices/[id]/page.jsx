'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../lib/auth-context';

function invoiceNumber(booking) {
  const year = new Date(booking.scheduledDate).getFullYear();
  return `JOB-${year}-${booking.id.slice(-8).toUpperCase()}`;
}

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
    else if (!authLoading && user?.accountKind !== 'COMPANY') router.push('/account');
  }, [authLoading, user]);

  useEffect(() => {
    if (!token) return;
    api.myBookings(token)
      .then(({ bookings }) => {
        const found = bookings.find((b) => b.id === id);
        if (!found || !found.payment || found.payment.status !== 'RELEASED') {
          setError('Facture introuvable.');
        } else {
          setBooking(found);
        }
      })
      .catch((e) => setError(e.message));
  }, [token, id]);

  if (!user) return null;

  if (error) {
    return (
      <div className="mx-auto max-w-xl">
        <Link href="/account/invoices" className="text-sm font-medium text-moss">← Mes factures</Link>
        <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>
      </div>
    );
  }

  if (!booking) return null;

  const { payment } = booking;
  const providerName = [booking.provider?.firstName, booking.provider?.lastName].filter(Boolean).join(' ');

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/account/invoices" className="text-sm font-medium text-moss">← Mes factures</Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark"
        >
          Imprimer / PDF
        </button>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-display text-2xl font-bold text-moss">Jobber</div>
            <div className="mt-1 text-xs text-slate-400">jobber.city</div>
          </div>
          <div className="text-right">
            <div className="font-display text-lg font-semibold text-ink">FACTURE</div>
            <div className="text-xs text-slate-400">{invoiceNumber(booking)}</div>
            <div className="text-xs text-slate-400">
              Émise le {new Date(payment.paidAt || booking.scheduledDate).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Facturé à</div>
            <div className="mt-1 text-sm font-medium text-ink">{user.companyName}</div>
            {user.companySiret && <div className="text-sm text-slate-500">SIRET {user.companySiret}</div>}
            {user.address && <div className="text-sm text-slate-500">{user.address}</div>}
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prestation réalisée par</div>
            <div className="mt-1 text-sm font-medium text-ink">{providerName || 'Prestataire Jobber'}</div>
          </div>
        </div>

        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2 font-medium">Description</th>
              <th className="pb-2 font-medium">Date</th>
              <th className="pb-2 text-right font-medium">Heures</th>
              <th className="pb-2 text-right font-medium">Taux</th>
              <th className="pb-2 text-right font-medium">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3 text-ink">
                {booking.mission?.title}
                <div className="text-xs text-slate-400">{booking.mission?.category?.name}</div>
              </td>
              <td className="py-3 text-slate-500">{new Date(booking.scheduledDate).toLocaleDateString('fr-FR')}</td>
              <td className="py-3 text-right text-slate-500">{booking.hours} h</td>
              <td className="py-3 text-right text-slate-500">{booking.hourlyRate} €/h</td>
              <td className="py-3 text-right text-ink">{booking.totalAmount.toFixed(2)} €</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-56 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Prestation</span>
              <span>{booking.totalAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Frais de mise en relation</span>
              <span>{payment.feeWaived ? 'Offerts (abonnement)' : `${payment.managerFee.toFixed(2)} €`}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1.5 font-semibold text-ink">
              <span>Total payé</span>
              <span>{payment.amount.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Facture générée automatiquement par Jobber lors du versement au prestataire.
        </p>
      </div>
    </div>
  );
}
