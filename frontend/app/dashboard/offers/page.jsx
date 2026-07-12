'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

const OFFER_STATUS_LABEL = {
  PENDING: { text: 'En attente', cls: 'bg-ochre-light text-ochre-dark' },
  ACCEPTED: { text: 'Acceptée', cls: 'bg-moss-light text-moss-dark' },
  REJECTED: { text: 'Refusée', cls: 'bg-slate-200 text-slate-600' },
  WITHDRAWN: { text: 'Retirée', cls: 'bg-slate-200 text-slate-600' },
};

export default function MyOffersPage() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.myOffers(token)
      .then(({ offers }) => setOffers(offers))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <span className="label-eyebrow text-moss">Mes offres</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Mes candidatures</h1>
      <p className="mt-1 text-sm text-slate-500">Missions auxquelles vous avez postulé, avec le tarif proposé.</p>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {loading && <p className="mt-6 text-slate-400">Chargement…</p>}

      {!loading && offers.length === 0 && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center">
          <p className="text-slate-500">Vous n'avez encore postulé à aucune mission.</p>
          <Link href="/missions" className="mt-4 inline-block rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark">
            Parcourir les missions
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {offers.map((offer) => {
          const status = OFFER_STATUS_LABEL[offer.status] || OFFER_STATUS_LABEL.PENDING;
          return (
            <Link
              key={offer.id}
              href={`/missions/${offer.mission.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 transition hover:border-moss hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-moss-light text-xl">
                  {offer.mission.category?.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="truncate font-display text-base font-semibold text-ink">{offer.mission.title}</h3>
                    <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-ink">{offer.hourlyRate} €/h</span>
                  </div>
                  <div className="mt-0.5 truncate text-sm text-slate-400">{offer.mission.address}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <span>{new Date(offer.mission.desiredDate).toLocaleDateString('fr-FR')}</span>
                <span className={`rounded-full px-2.5 py-0.5 font-medium ${status.cls}`}>{status.text}</span>
                <span className="ml-auto text-slate-400">Envoyée le {new Date(offer.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
