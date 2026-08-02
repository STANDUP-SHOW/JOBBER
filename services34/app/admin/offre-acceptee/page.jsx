'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../../lib/agency-auth-context';
import { agencyApi } from '../../../lib/agencyApi';

export default function OffreAccepteeParLeClientPage() {
  const { token } = useAgencyAuth();
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function refresh() {
    try {
      const { pending } = await agencyApi.offreAcceptee(token);
      setPending(pending);
    } catch (err) { setError(err.message); }
  }

  useEffect(() => { if (token) refresh(); }, [token]);

  async function commander(bookingId) {
    setBusyId(bookingId);
    try {
      await agencyApi.commanderMission(bookingId, token);
      await refresh();
    } catch (err) { setError(err.message); } finally { setBusyId(null); }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Offre acceptée par le client</h1>
      <p className="mt-1 text-sm text-slate-500">
        Le client a accepté votre devis et payé — le jobber n'est prévenu qu'une fois que vous commandez la mission.
      </p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      <div className="mt-6 space-y-3">
        {pending === null && <p className="text-sm text-slate-400">Chargement…</p>}
        {pending?.length === 0 && <p className="text-sm text-slate-400">Aucun devis accepté en attente de commande.</p>}
        {pending?.map(({ offer, booking }) => {
          const jobber = offer.sourceOffer?.provider;
          return (
            <div key={booking.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-display text-base font-semibold text-ink">
                    {offer.mission.category?.icon}{' '}
                    <Link href={`/admin/missions/${offer.mission.id}`} className="hover:underline">{offer.mission.title}</Link>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {offer.mission.client?.firstName} {offer.mission.client?.lastName} · {offer.mission.client?.phone}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Jobber sélectionné : <strong>{jobber?.firstName} {jobber?.lastName?.[0]}.</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand-dark">Payé par le client</div>
                  <div className="mt-1 text-lg font-semibold text-ink">{booking.totalAmount.toFixed(2)} €</div>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  disabled={busyId === booking.id}
                  onClick={() => commander(booking.id)}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
                >
                  {busyId === booking.id ? 'Envoi…' : 'Commander la mission'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
