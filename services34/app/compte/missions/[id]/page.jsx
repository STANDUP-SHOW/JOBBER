'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../lib/auth-context';
import MissionCountdown from '../../../../components/MissionCountdown';
import DistanceBadge from '../../../../components/DistanceBadge';
import { haversineDistanceKm } from '../../../../lib/geo';

const STATUS_LABELS = {
  OPEN: 'En attente',
  ASSIGNED: 'Agent trouvé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

const EXTRA_FEE_LABELS = {
  displacement: 'Frais de route - Déplacement',
  vehicle: 'Frais de mise à disposition du véhicule requis',
  fuel: 'Frais de carburant',
  consumables: 'Frais de consommables utilisés (produits, cartons)',
  equipment: 'Frais de matériel (location...)',
  wasteDisposal: 'Frais de déchetterie',
};

export default function MissionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [mission, setMission] = useState(null);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const [contacting, setContacting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push(`/auth/login?next=/compte/missions/${id}`);
  }, [authLoading, user, router, id]);

  function refresh() {
    if (!token) return;
    api.mission(id, token).then(({ mission }) => setMission(mission)).catch((err) => setError(err.message));
  }

  useEffect(refresh, [token, id]);

  async function acceptProposal(offerId) {
    setAccepting(true);
    setAcceptError('');
    try {
      await api.acceptOffer(offerId, token);
      refresh();
    } catch (err) {
      setAcceptError(err.message);
    } finally {
      setAccepting(false);
    }
  }

  async function contactAgency() {
    if (!mission?.corporateAgencyId) return;
    setContacting(true);
    setError('');
    try {
      const { conversation } = await api.startConversation({ missionId: mission.id, providerId: mission.corporateAgencyId }, token);
      router.push(`/messages/${conversation.id}`);
    } catch (err) { setError(err.message); }
    finally { setContacting(false); }
  }

  if (authLoading || !user) return null;
  if (error) return <p className="mx-auto max-w-2xl rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>;
  if (!mission) return <p className="mx-auto max-w-2xl text-sm text-slate-400">Chargement…</p>;

  const distanceKm = user.lat != null && user.lng != null && mission.lat != null && mission.lng != null
    ? Math.round(haversineDistanceKm(user.lat, user.lng, mission.lat, mission.lng) * 10) / 10
    : null;
  const pendingOffer = mission.offers?.find((o) => o.status === 'PENDING');
  const isAgenceOffer = pendingOffer && mission.corporateAgencyId;
  const isConfirmed = mission.status === 'ASSIGNED' || mission.status === 'IN_PROGRESS';

  const offerHours = pendingOffer?.hours ?? mission.estimatedHours;
  const offerExtraFees = pendingOffer?.extraFees || [];
  const offerExtraFeesTotal = offerExtraFees.reduce((sum, f) => sum + f.amount, 0);
  const offerTotal = pendingOffer ? (pendingOffer.hourlyRate * offerHours + offerExtraFeesTotal).toFixed(2).replace(/\.00$/, '') : null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/compte" className="text-sm text-slate-500 hover:text-brand">← Mon compte</Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <span className="label-eyebrow text-brand">{mission.category?.name}</span>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">{mission.category?.icon} {mission.title}</h1>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {isAgenceOffer ? 'Proposition reçue' : STATUS_LABELS[mission.status] || mission.status}
        </span>
      </div>

      {isAgenceOffer && (
        <section className="mt-6 rounded-lg border-2 border-brand bg-brand-light p-5">
          <div className="font-display text-lg font-semibold text-ink">Proposition reçue</div>
          <p className="mt-1 text-sm text-ink">
            Un agent Services 34 a préparé un devis pour votre demande. Vérifiez le récapitulatif ci-dessous et confirmez pour planifier votre intervention.
          </p>

          <div className="mt-4 space-y-2 rounded-lg bg-white p-4">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date d'intervention</span>
              <span className="font-medium text-ink">{new Date(mission.desiredDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tarif horaire</span>
              <span className="font-medium text-ink">{pendingOffer.hourlyRate} €/h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Durée</span>
              <span className="font-medium text-ink">{offerHours} h</span>
            </div>
            {offerExtraFees.map((f) => (
              <div key={f.key} className="flex justify-between text-sm">
                <span className="text-slate-500">{EXTRA_FEE_LABELS[f.key] || f.label}</span>
                <span className="font-medium text-ink">{f.amount} €</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-semibold text-ink">
              <span>Total</span>
              <span>{offerTotal} €</span>
            </div>
          </div>

          {acceptError && <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{acceptError}</p>}

          <button
            type="button"
            disabled={accepting}
            onClick={() => acceptProposal(pendingOffer.id)}
            className="mt-4 w-full rounded-md bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {accepting ? 'Confirmation…' : `Accepter le devis — ${offerTotal} €`}
          </button>
        </section>
      )}

      {isConfirmed && (
        <section className="mt-6 rounded-lg border border-brand/30 bg-brand-light p-5 text-center">
          <MissionCountdown desiredDate={mission.desiredDate} />
        </section>
      )}

      <section className="relative mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <DistanceBadge distanceKm={distanceKm} />
        <h2 className="font-display text-base font-semibold text-ink">Votre demande</h2>
        <p className="mt-2 text-sm text-slate-600">{mission.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-slate-400">Adresse</div>
            <div className="text-ink">{mission.address}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Date souhaitée</div>
            <div className="text-ink">{new Date(mission.desiredDate).toLocaleDateString('fr-FR')}</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Durée estimée</div>
            <div className="text-ink">{mission.estimatedHours} h</div>
          </div>
          {mission.isUrgent && (
            <div>
              <div className="text-xs text-slate-400">Urgence</div>
              <div className="text-ink">Oui</div>
            </div>
          )}
        </div>

        {mission.corporateAgencyId && (
          <button
            type="button"
            disabled={contacting}
            onClick={contactAgency}
            className="mt-4 w-full rounded-md border border-slate-200 py-2.5 text-sm font-medium text-ink hover:border-brand disabled:opacity-60"
          >
            💬 Contacter l'agence
          </button>
        )}
      </section>

      {mission.photos?.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-base font-semibold text-ink">Photos</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {mission.photos.map((src) => (
              <div key={src} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200">
                <Image src={src} alt="Photo de la demande" fill className="object-cover" sizes="200px" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
