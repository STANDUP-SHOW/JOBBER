'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';

export default function MissionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();

  const [mission, setMission] = useState(null);
  const [error, setError] = useState('');
  const [offerForm, setOfferForm] = useState({ hourlyRate: '', message: '' });
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const { mission } = await api.getMission(id);
    setMission(mission);
  }

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, [id]);

  const isOwner = user && mission && mission.clientId === user.id;
  const alreadyApplied = user && mission?.offers?.some((o) => o.providerId === user.id);

  async function applyToMission(e) {
    e.preventDefault();
    if (!user) return router.push('/auth/login');
    setBusy(true); setError('');
    try {
      await api.createOffer({ missionId: id, hourlyRate: Number(offerForm.hourlyRate), message: offerForm.message }, token);
      await refresh();
      setOfferForm({ hourlyRate: '', message: '' });
    } catch (err) { setError(err.message); } finally { setBusy(false); }
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

      <dl className="mt-5 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-4">
        <Item label="Adresse" value={mission.address} />
        <Item label="Date souhaitée" value={new Date(mission.desiredDate).toLocaleDateString('fr-FR')} />
        <Item label="Durée estimée" value={`${mission.estimatedHours} h`} />
        <Item label="Statut" value={mission.status} />
      </dl>

      {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

      {!isOwner && mission.status === 'OPEN' && !alreadyApplied && (
        <form onSubmit={applyToMission} className="mt-8 space-y-3 rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-display text-lg font-medium text-ink">Proposer mes services</h2>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Votre tarif horaire (€)</span>
            <input
              type="number" min="5" step="0.5" required
              value={offerForm.hourlyRate}
              onChange={(e) => setOfferForm({ ...offerForm, hourlyRate: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-500">Message (optionnel)</span>
            <textarea
              rows={3}
              value={offerForm.message}
              onChange={(e) => setOfferForm({ ...offerForm, message: e.target.value })}
              className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
            />
          </label>
          <button disabled={busy} className="rounded-md bg-moss px-5 py-2.5 font-medium text-paper hover:bg-moss-dark disabled:opacity-60">
            Envoyer ma candidature
          </button>
        </form>
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
