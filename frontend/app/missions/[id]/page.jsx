'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import ApplyOfferSheet from '../../../components/ApplyOfferSheet';
import StarRating from '../../../components/StarRating';
import MissionRouteMap from '../../../components/MissionRouteMap';

function CalendarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function PinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function InfoRow({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss-light text-moss">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="text-sm text-ink">{children}</span>
    </div>
  );
}

function timeAgo(dateStr) {
  const hours = Math.floor((Date.now() - new Date(dateStr).getTime()) / (60 * 60 * 1000));
  if (hours < 1) return "à l'instant";
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} jour${days > 1 ? 's' : ''}`;
}

// Addresses are shown truncated to "postal code + city" on the pre-application
// jobber view, matching the jittered map pin's approximate privacy.
function shortAddress(address) {
  if (!address) return '';
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean).filter((p) => p.toLowerCase() !== 'france');
  const postalIndex = parts.findIndex((p) => /^\d{5}\b/.test(p));
  if (postalIndex === -1) return parts[parts.length - 1] || address;
  const postalPart = parts[postalIndex];
  if (/[a-zA-Zàâäéèêëïîôöùûüç]/.test(postalPart.replace(/^\d{5}/, ''))) return postalPart;
  const neighbor = parts[postalIndex - 1] || parts[postalIndex + 1];
  return neighbor ? `${postalPart} ${neighbor}` : postalPart;
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export default function MissionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();

  const [mission, setMission] = useState(null);
  const [error, setError] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [busy, setBusy] = useState(false);
  const [quotaNotice, setQuotaNotice] = useState(null);

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

  async function applyToMission(hourlyRate) {
    setBusy(true); setOfferError('');
    try {
      await api.createOffer({ missionId: id, hourlyRate }, token);
      await refresh();
      setSheetOpen(false);
    } catch (err) { setOfferError(err.message); } finally { setBusy(false); }
  }

  async function acceptOffer(offerId) {
    setBusy(true); setError('');
    try {
      const { quotaExceeded } = await api.acceptOffer(offerId, token);
      if (quotaExceeded) {
        setQuotaNotice('Vous avez dépassé votre quota de missions sans frais ce mois-ci : les frais standards s\'appliquent sur cette mission.');
        setBusy(false);
        return;
      }
      router.push(`/dashboard`);
    } catch (err) { setError(err.message); setBusy(false); }
  }

  if (error && !mission) return <p className="text-clay">{error}</p>;
  if (!mission) return <p className="text-slate-400">Chargement…</p>;

  if (!isOwner) {
    const start = new Date(mission.desiredDate);
    const end = new Date(start.getTime() + mission.estimatedHours * 3600 * 1000);
    const fmtTime = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const dateLabel = capitalize(start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
    const indicativeRate = user?.providerProfile?.categories?.find((c) => c.categoryId === mission.categoryId)?.hourlyRate ?? 15;
    const indicativePrice = Math.round(indicativeRate * mission.estimatedHours);
    const applicantCount = mission.offers?.length ?? 0;

    return (
      <div className="mx-auto max-w-2xl">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-ink">
          ← Retour
        </button>

        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
          <MissionRouteMap destination={mission.lat != null && mission.lng != null ? { lat: mission.lat, lng: mission.lng } : null} />
        </div>

        <div className="mt-5 flex items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink">{mission.title}</h1>
          <div className="shrink-0 text-right">
            <div className="font-display text-2xl font-bold text-ink">~{indicativePrice} €</div>
            <div className="text-xs text-slate-400">estimation</div>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss-light font-display text-xs text-moss-dark">
            {mission.client?.avatarUrl ? (
              <img src={mission.client.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              mission.client?.firstName?.[0]
            )}
          </span>
          <span className="text-sm text-slate-500">
            Publié par {mission.client?.firstName} · {timeAgo(mission.createdAt)}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          <InfoRow icon={CalendarIcon}>{dateLabel}</InfoRow>
          <InfoRow icon={ClockIcon}>{fmtTime(start)} à {fmtTime(end)} ({mission.estimatedHours}h)</InfoRow>
          <InfoRow icon={PinIcon}>{shortAddress(mission.address)}</InfoRow>
        </div>

        {mission.photos?.length > 0 && (
          <div className="mt-5 flex gap-2 overflow-x-auto">
            {mission.photos.map((url) => (
              <img key={url} src={url} alt="" className="h-32 w-32 shrink-0 rounded-lg object-cover" />
            ))}
          </div>
        )}

        <div className="mt-6 border-t border-slate-100 pt-5">
          <h2 className="font-display text-lg font-medium text-ink">Description</h2>
          <p className="mt-2 text-sm text-slate-600">{mission.description}</p>
        </div>

        {applicantCount > 0 && mission.status === 'OPEN' && (
          <div className="mt-5 flex items-center gap-2 rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-600">
            <span>ℹ️</span>
            Déjà <strong className="text-ink">{applicantCount}</strong> prestataire{applicantCount > 1 ? 's ont' : ' a'} postulé
          </div>
        )}

        {error && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        {quotaNotice && (
          <div className="mt-4 rounded-md bg-ochre/10 px-4 py-3 text-sm text-ink">
            <p>{quotaNotice}</p>
            <div className="mt-2 flex gap-3">
              <a href="/dashboard" className="font-medium text-moss">Voir mes réservations</a>
              <a href="/account/subscription" className="font-medium text-moss">Passer à Manager Holder</a>
            </div>
          </div>
        )}

        {alreadyApplied && mission.status === 'OPEN' && (
          <p className="mt-5 rounded-md bg-moss-light px-4 py-3 text-sm text-moss-dark">Votre candidature a été envoyée.</p>
        )}

        {mission.status === 'OPEN' && !alreadyApplied && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push('/missions')}
              className="flex-1 rounded-full border border-slate-200 py-3.5 text-sm font-semibold text-clay hover:border-clay"
            >
              Ignorer
            </button>
            <button
              onClick={openApply}
              className="flex-1 rounded-full bg-moss py-3.5 text-sm font-semibold text-white hover:bg-moss-dark"
            >
              Postuler →
            </button>
          </div>
        )}

        {sheetOpen && (
          <ApplyOfferSheet
            mission={mission}
            defaultRate={indicativeRate}
            busy={busy}
            error={offerError}
            onClose={() => setSheetOpen(false)}
            onSubmit={applyToMission}
          />
        )}
      </div>
    );
  }

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

      {quotaNotice && (
        <div className="mt-4 rounded-md bg-ochre/10 px-4 py-3 text-sm text-ink">
          <p>{quotaNotice}</p>
          <div className="mt-2 flex gap-3">
            <a href="/dashboard" className="font-medium text-moss">Voir mes réservations</a>
            <a href="/account/subscription" className="font-medium text-moss">Passer à Manager Holder</a>
          </div>
        </div>
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
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{offer.provider.firstName} {offer.provider.lastName?.[0]}.</span>
                  {offer.provider.providerProfile?.ratingCount > 0 && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <StarRating value={offer.provider.providerProfile.ratingAverage} size={12} />
                      {offer.provider.providerProfile.ratingAverage.toFixed(1)} ({offer.provider.providerProfile.ratingCount})
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-500">{offer.hourlyRate} €/h {offer.message ? `— "${offer.message}"` : ''}</div>
                <div className="text-xs text-slate-400 mt-1">Statut : {offer.status}</div>
              </div>
              {offer.status === 'PENDING' && mission.status === 'OPEN' && (
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
