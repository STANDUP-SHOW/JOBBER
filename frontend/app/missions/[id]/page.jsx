'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import ApplyOfferSheet from '../../../components/ApplyOfferSheet';

export default function MissionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();

  const [mission, setMission] = useState(null);
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { mission } = await api.getMission(id);
    setMission(mission);
  }

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, [id]);

  const isOwner = user && mission && mission.clientId === user.id;
  const alreadyApplied = user && mission?.offers?.some((o) => o.providerId === user.id);

  function openApply() {
    if (!user) return router.push('/auth/login');
    setOfferError('');
    setSheetOpen(true);
  }

  async function applyToMission(hourlyRate, message) {
    setBusy(true); setOfferError('');
    try {
      await api.createOffer({ missionId: id, hourlyRate, message }, token);
      await refresh();
      setSheetOpen(false);
    } catch (err) { setOfferError(err.message); } finally { setBusy(false); }
  }

  async function acceptOffer(offerId) {
    setBusy(true); setError('');
    try {
      const { booking } = await api.acceptOffer(offerId, token);
      router.push(`/dashboard`);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (error && !mission) return <p className="text-clay">{error}</p>;
  if (!mission) return <p className="text-slate-400">Chargement…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <span className="label-eyebrow text-moss">{mission.category?.name}</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{mission.title}</h1>
      <p className="mt-3 text-slate-600">{mission.description}</p>

      {mission.photos?.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {mission.photos.map((url) => (
            <img key={url} src={url} alt="" className="h-32 w-32 shrink-0 rounded-lg object-cover" />
          ))}
        </div>
      )}

      <dl className="mt-5 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-4">
        <Item label="Adresse" value={mission.address} />
        <Item label="Date souhaitée" value={new Date(mission.desiredDate).toLocaleDateString('fr-FR')} />
        <Item label="Durée estimée" value={`${mission.estimatedHours} h`} />
        <Item label="Statut" value={mission.status} />
      </dl>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {!isOwner && mission.status === 'OPEN' && !alreadyApplied && (
        <button
          onClick={openApply}
          className="mt-8 w-full rounded-full bg-moss py-4 text-base font-semibold text-white hover:bg-moss-dark sm:w-auto sm:px-8"
        >
          Postuler
        </button>
      )}

      {sheetOpen && (
        <ApplyOfferSheet
          mission={mission}
          defaultRate={user?.providerProfile?.defaultHourlyRate ?? 15}
          busy={busy}
          error={offerError}
          onClose={() => setSheetOpen(false)}
          onSubmit={applyToMission}
        />
      )}

      {alreadyApplied && mission.status === 'OPEN' && (
        <p className="mt-8 rounded-md bg-moss-light px-4 py-3 text-sm text-moss-dark">Votre candidature a été envoyée.</p>
      )}

      <section className="mt-10">
        <h2 className="font-display text-lg font-medium text-ink">
          Candidatures {mission.offers?.length ? `(${mission.offers.length})` : ''}
        </h2>
        <div className="mt-3 space-y-3">
          {mission.offers?.length === 0 && <p className="text-sm text-slate-400">Aucune candidature pour l'instant.</p>}
          {mission.offers?.map((offer) => (
            <div key={offer.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
              <div>
                <div className="font-medium text-ink">{offer.provider.firstName} {offer.provider.lastName?.[0]}.</div>
                <div className="text-sm text-slate-500">{offer.hourlyRate} €/h {offer.message ? `— "${offer.message}"` : ''}</div>
                <div className="text-xs text-slate-400 mt-1">Statut : {offer.status}</div>
              </div>
              {isOwner && offer.status === 'PENDING' && mission.status === 'OPEN' && (
                <button
                  disabled={busy}
                  onClick={() => acceptOffer(offer.id)}
                  className="rounded-md bg-moss px-4 py-2 text-sm font-medium text-white hover:bg-moss-dark disabled:opacity-60"
                >
                  Accepter
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}
