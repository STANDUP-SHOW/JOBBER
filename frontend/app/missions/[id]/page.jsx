'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../lib/api';
import { useAuth } from '../../../lib/auth-context';
import ApplyOfferSheet from '../../../components/ApplyOfferSheet';
import MissionRouteMap from '../../../components/MissionRouteMap';
import MissionBadges from '../../../components/MissionBadges';
import VehicleIcon, { VEHICLES } from '../../../components/VehicleIcon';
import MechanicVehicleIcon, { MECHANIC_VEHICLE_TYPES } from '../../../components/MechanicVehicleIcon';
import { BADGE_CATALOG } from '../../../lib/badgeCatalog';

function ToolboxIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="8" width="20" height="12" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M2 13h20" />
    </svg>
  );
}

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

function RepeatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
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

const MISSION_LIST_IDS_KEY = 'jobber:missionListIds';
const MISSION_LIST_HREF_KEY = 'jobber:missionListHref';

// Back-to-list / next-mission nav, styled to match AccountBackButton
// (blue background, yellow text) so mission browsing feels consistent
// with the rest of the account UI, regardless of whether the mission
// came from Jobber's own feed or a corporate/Services34 posting.
function MissionNavBar({ backHref, nextId }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={() => router.push(backHref)}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-yellow-300 hover:bg-blue-700"
      >
        ← Retour liste mission
      </button>
      {nextId && (
        <button
          onClick={() => router.push(`/missions/${nextId}`)}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-yellow-300 hover:bg-blue-700"
        >
          Mission suivante →
        </button>
      )}
    </div>
  );
}

const STATUS_LABEL = {
  OPEN: { text: 'Ouverte', cls: 'bg-moss-light text-moss-dark' },
  ASSIGNED: { text: 'Attribuée', cls: 'bg-ochre-light text-ochre-dark' },
  IN_PROGRESS: { text: 'En cours', cls: 'bg-ochre-light text-ochre-dark' },
  COMPLETED: { text: 'Terminée', cls: 'bg-slate-200 text-slate-600' },
  CANCELLED: { text: 'Annulée', cls: 'bg-slate-200 text-slate-600' },
};

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
// jobber view, matching the jittered map pin's approximate privacy. The
// mission owner always sees their own full address.
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

function posterName(mission) {
  return mission.client?.accountKind === 'COMPANY' ? mission.client.companyName : mission.client?.firstName;
}

const RECURRENCE_UNIT_LABELS = { JOUR: 'jour', SEMAINE: 'semaine', MOIS: 'mois', AN: 'an' };

function recurrenceLabel(mission) {
  if (!mission?.isRecurring || !mission.recurrenceCount || !mission.recurrenceUnit) return null;
  const unit = RECURRENCE_UNIT_LABELS[mission.recurrenceUnit] || mission.recurrenceUnit.toLowerCase();
  return `${mission.recurrenceCount} fois par ${unit}`;
}

function formatDetailValue(field, value) {
  if (value == null || value === '') return null;
  if (field?.type === 'boolean') return value ? 'Oui' : 'Non';
  if (field?.unit) return `${value} ${field.unit}`;
  return String(value);
}

function MissionDetails({ mission }) {
  const fields = mission.service?.detailFields || [];
  const details = mission.details || {};
  const entries = fields
    .map((field) => ({ field, display: formatDetailValue(field, details[field.key]) }))
    .filter((e) => e.display != null);
  if (entries.length === 0) return null;

  const isMechanicVehicle = mission.category?.slug === 'mecanique' && MECHANIC_VEHICLE_TYPES.includes(mission.service?.name);
  if (isMechanicVehicle) {
    return (
      <div className="mt-6 rounded-lg border-2 border-moss bg-moss-light p-4">
        <div className="flex items-center gap-2">
          <MechanicVehicleIcon type={mission.service.name} className="h-8 w-12 shrink-0" />
          <span className="font-display text-sm font-bold uppercase tracking-wide text-moss-dark">
            {mission.service.name}
          </span>
        </div>
        <p className="mt-2.5 text-sm font-medium text-ink">
          {entries.map((e) => e.display).join('  —  ')}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <h2 className="font-display text-lg font-medium text-ink">Précisions sur « {mission.service?.name} »</h2>
      <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {entries.map(({ field, display }) => (
          <div key={field.key}>
            <dt className="text-xs text-slate-400">{field.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{display}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function MissionRequirements({ mission }) {
  const equipmentNames = (mission.requiredEquipment || []).map((re) => re.equipment.name);
  const vehicleEntries = (mission.requiredVehicleTypes || []).map((t) => ({ type: t, label: VEHICLES.find((v) => v.type === t)?.label || t }));
  const hasEquipment = equipmentNames.length > 0 || mission.otherEquipmentNote;
  const hasVehicle = vehicleEntries.length > 0 || mission.otherVehicleNote;
  const hasPpe = (mission.requiredPpe || []).length > 0;
  const hasMachine = (mission.requiredMachines || []).length > 0;
  const requiredBadgeKeys = (mission.requiredBadges || []).filter((k) => BADGE_CATALOG[k]);
  const hasBadges = requiredBadgeKeys.length > 0;
  if (!hasEquipment && !hasVehicle && !hasPpe && !hasMachine && !hasBadges) return null;

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <h2 className="font-display text-lg font-medium text-ink">Prérequis</h2>
      <div className="mt-3 space-y-4">
        {hasEquipment && (
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-moss-light text-moss-dark">
                <ToolboxIcon className="h-5 w-5" />
              </span>
              Matériel à apporter {mission.equipmentProvidedByCompany && '— fourni par l\'entreprise'}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {equipmentNames.map((name) => (
                <span key={name} className="rounded-full bg-moss-light px-3 py-1 text-sm text-moss-dark">{name}</span>
              ))}
              {mission.otherEquipmentNote && (
                <span className="rounded-full bg-moss-light px-3 py-1 text-sm text-moss-dark">{mission.otherEquipmentNote}</span>
              )}
            </div>
          </div>
        )}
        {hasVehicle && (
          <div>
            <span className="text-sm font-semibold text-slate-600">Véhicule requis</span>
            <div className="mt-1.5 flex flex-wrap gap-3">
              {vehicleEntries.map(({ type, label }) => (
                <div key={type} className="flex flex-col items-center gap-1">
                  <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-ochre-light text-ochre-dark">
                    <VehicleIcon type={type} className="h-7 w-9" />
                  </span>
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
              ))}
              {mission.otherVehicleNote && (
                <span className="self-center rounded-full bg-ochre-light px-3 py-1 text-sm text-ochre-dark">{mission.otherVehicleNote}</span>
              )}
            </div>
          </div>
        )}
        {hasBadges && (
          <div>
            <span className="text-sm font-semibold text-slate-600">Badges souhaités chez le jobber</span>
            <div className="mt-1.5 space-y-2">
              {requiredBadgeKeys.map((key) => {
                const badge = BADGE_CATALOG[key];
                return (
                  <div key={key} className="flex items-start gap-2 rounded-lg bg-blue-600 p-3">
                    <span className="text-lg leading-none">{badge.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-yellow-300">{badge.name}</div>
                      <div className="text-xs text-yellow-100">{badge.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {hasPpe && (
          <div>
            <span className="text-sm font-semibold text-slate-600">
              EPI {mission.ppeProvidedByCompany ? '— fournis par l\'entreprise' : 'requis'}
            </span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {mission.requiredPpe.map((name) => (
                <span key={name} className="rounded-full bg-ochre-light px-3 py-1 text-sm text-ochre-dark">{name}</span>
              ))}
            </div>
          </div>
        )}
        {hasMachine && (
          <div>
            <span className="text-sm font-semibold text-slate-600">Machine à utiliser sur place</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {mission.requiredMachines.map((name) => (
                <span key={name} className="rounded-full bg-moss-light px-3 py-1 text-sm text-moss-dark">{name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
  const [selectedSlots, setSelectedSlots] = useState({}); // offerId -> slot index
  const [navList, setNavList] = useState({ ids: [], href: '/missions' });

  async function refresh() {
    const { mission } = await api.getMission(id, token);
    setMission(mission);
  }

  useEffect(() => { refresh().catch((e) => setError(e.message)); }, [id, token]);

  // The list you were browsing (Jobber's own feed, your "Suivi de missions"…)
  // is stashed in sessionStorage by that list page, so "Mission suivante"
  // can step through the same order you were looking at.
  useEffect(() => {
    try {
      const ids = JSON.parse(sessionStorage.getItem(MISSION_LIST_IDS_KEY) || '[]');
      const href = sessionStorage.getItem(MISSION_LIST_HREF_KEY) || '/missions';
      setNavList({ ids, href });
    } catch { setNavList({ ids: [], href: '/missions' }); }
  }, []);

  const navIndex = navList.ids.indexOf(id);
  const nextMissionId = navIndex >= 0 ? navList.ids[navIndex + 1] : null;

  const isOwner = user && mission && mission.clientId === user.id;
  const alreadyApplied = user && mission?.offers?.some((o) => o.providerId === user.id);

  function openApply() {
    if (!user) return router.push('/auth/login');
    setOfferError('');
    setSheetOpen(true);
  }

  async function applyToMission(hourlyRate, extraFees, proposedSlots) {
    setBusy(true); setOfferError('');
    try {
      await api.createOffer({ missionId: id, hourlyRate, extraFees, proposedSlots }, token);
      await refresh();
      setSheetOpen(false);
    } catch (err) { setOfferError(err.message); } finally { setBusy(false); }
  }

  async function claimGetMission() {
    if (!user) return router.push('/auth/login');
    setBusy(true); setError('');
    try {
      await api.claimGetMission(id, token);
      router.push('/account');
    } catch (err) { setError(err.message); setBusy(false); await refresh(); }
  }

  async function acceptOffer(offerId, slot) {
    let chosenSlot;
    if (slot) {
      const [year, month, day] = slot.date.split('-').map(Number);
      const [hour, minute] = slot.startTime.split(':').map(Number);
      chosenSlot = { date: slot.date, startTime: slot.startTime, scheduledDate: new Date(year, month - 1, day, hour, minute).toISOString() };
    }
    setBusy(true); setError('');
    try {
      const { quotaExceeded } = await api.acceptOffer(offerId, chosenSlot, token);
      if (quotaExceeded) {
        setQuotaNotice('Vous avez dépassé votre quota de missions sans frais ce mois-ci : les frais standards s\'appliquent sur cette mission.');
        setBusy(false);
        return;
      }
      router.push('/account');
    } catch (err) { setError(err.message); setBusy(false); }
  }

  if (error && !mission) return <p className="text-clay">{error}</p>;
  if (!mission) return <p className="text-slate-400">Chargement…</p>;

  // Same rich template for everyone — map, price, badges, prérequis — the
  // only thing that changes below is the footer: apply flow for a
  // candidate, the candidatures list for the mission's owner. Previously
  // the owner saw a much sparser page (no map, no price, no description
  // layout), which read as if missions from different sources were being
  // presented inconsistently — they weren't, it was just owner vs
  // candidate view.
  const start = new Date(mission.desiredDate);
  const end = new Date(start.getTime() + mission.estimatedHours * 3600 * 1000);
  const fmtTime = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateLabel = capitalize(start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
  const endDateLabel = mission.missionEndDate
    ? new Date(mission.missionEndDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    : null;
  const indicativeRate = user?.providerProfile?.categories?.find((c) => c.categoryId === mission.categoryId)?.hourlyRate ?? 15;
  const indicativePrice = Math.round(indicativeRate * mission.estimatedHours);
  const applicantCount = mission.offers?.length ?? 0;
  const isTransportMission = mission.dropoffAddress && mission.dropoffLat != null && mission.dropoffLng != null;
  const status = STATUS_LABEL[mission.status];
  const displayAddress = (addr) => (isOwner ? addr : shortAddress(addr));

  return (
    <div className="max-w-2xl">
      <MissionNavBar backHref={navList.href} nextId={nextMissionId} />

      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
        {isTransportMission ? (
          <MissionRouteMap
            origin={{ lat: mission.lat, lng: mission.lng }}
            destination={{ lat: mission.dropoffLat, lng: mission.dropoffLng }}
          />
        ) : (
          <MissionRouteMap destination={mission.lat != null && mission.lng != null ? { lat: mission.lat, lng: mission.lng } : null} />
        )}
      </div>

      <div className="mt-5 flex items-start justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">{mission.title}</h1>
        <div className="shrink-0 text-right">
          {mission.isGetMission ? (
            <>
              <div className="font-display text-2xl font-bold text-green-600">{mission.getMissionPrice} €</div>
              <div className="text-xs text-slate-400">tarif fixe</div>
            </>
          ) : (
            <>
              <div className="font-display text-2xl font-bold text-ink">~{indicativePrice} €</div>
              <div className="text-xs text-slate-400">estimation</div>
            </>
          )}
        </div>
      </div>

      {status && (
        <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>{status.text}</span>
      )}

      <MissionBadges mission={mission} className="mt-2" />

      <div className="mt-2 flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-moss-light font-display text-xs text-moss-dark">
          {mission.client?.avatarUrl ? (
            <img src={mission.client.avatarUrl} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            posterName(mission)?.[0]
          )}
        </span>
        <span className="flex items-center gap-1.5 text-sm text-slate-500">
          Publié par {posterName(mission)} · {timeAgo(mission.createdAt)}
          {mission.client?.accountKind === 'COMPANY' && (
            <span className="rounded-full bg-moss px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {mission.client.companyType === 'CORPORATE' ? 'Corporate' : 'Entreprise'}
            </span>
          )}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <InfoRow icon={CalendarIcon}>{endDateLabel ? `Du ${dateLabel} au ${endDateLabel}` : dateLabel}</InfoRow>
        <InfoRow icon={ClockIcon}>{fmtTime(start)} à {fmtTime(end)} ({mission.estimatedHours}h)</InfoRow>
        {recurrenceLabel(mission) && <InfoRow icon={RepeatIcon}>Mission à réaliser {recurrenceLabel(mission)}</InfoRow>}
        {isTransportMission ? (
          <>
            <InfoRow icon={PinIcon}>Départ : {displayAddress(mission.address)}</InfoRow>
            <InfoRow icon={PinIcon}>Arrivée : {displayAddress(mission.dropoffAddress)}</InfoRow>
          </>
        ) : (
          <InfoRow icon={PinIcon}>{displayAddress(mission.address)}</InfoRow>
        )}
        {mission.distanceKm != null && (
          <InfoRow icon={PinIcon}>
            <strong>{mission.distanceKm < 1 ? `${Math.round(mission.distanceKm * 1000)} m` : `${mission.distanceKm} km`}</strong> depuis votre adresse — pensez-y pour vos frais de route
          </InfoRow>
        )}
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

      <MissionDetails mission={mission} />
      <MissionRequirements mission={mission} />

      {!isOwner && applicantCount > 0 && mission.status === 'OPEN' && (
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

      {!isOwner && alreadyApplied && mission.status === 'OPEN' && (
        <p className="mt-5 rounded-md bg-moss-light px-4 py-3 text-sm text-moss-dark">Votre candidature a été envoyée.</p>
      )}

      {!isOwner && mission.status === 'OPEN' && !alreadyApplied && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push('/missions')}
            className="flex-1 rounded-full border border-slate-200 py-3.5 text-sm font-semibold text-clay hover:border-clay"
          >
            Ignorer
          </button>
          {mission.isGetMission ? (
            <button
              onClick={claimGetMission}
              disabled={busy}
              className="flex-1 rounded-full bg-green-600 py-3.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
            >
              {busy ? 'Un instant…' : 'GET MISSION →'}
            </button>
          ) : (
            <button
              onClick={openApply}
              className="flex-1 rounded-full bg-moss py-3.5 text-sm font-semibold text-white hover:bg-moss-dark"
            >
              Postuler →
            </button>
          )}
        </div>
      )}

      {!isOwner && sheetOpen && (
        <ApplyOfferSheet
          mission={mission}
          defaultRate={indicativeRate}
          busy={busy}
          error={offerError}
          onClose={() => setSheetOpen(false)}
          onSubmit={applyToMission}
        />
      )}

      {isOwner && (
        <section className="mt-10">
          <h2 className="font-display text-lg font-medium text-ink">
            Candidatures {mission.offers?.length ? `(${mission.offers.length})` : ''}
          </h2>
          <div className="mt-3 space-y-3">
            {mission.offers?.length === 0 && <p className="text-sm text-slate-400">Aucune candidature pour l'instant.</p>}
            {mission.offers?.map((offer) => {
              const hasProposedSlots = offer.status === 'PENDING' && offer.proposedSlots?.length > 0;
              const selectedIndex = selectedSlots[offer.id];
              return (
                <div key={offer.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col items-center gap-1.5">
                      {offer.provider.avatarUrl ? (
                        <img src={offer.provider.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-moss-light font-display text-lg text-moss-dark">
                          {offer.provider.firstName?.[0]}
                        </div>
                      )}
                      <span className="text-sm font-medium text-ink">{offer.provider.firstName}</span>
                      {offer.provider.isProfessional && (
                        <span className="rounded-full bg-ochre px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">PRO</span>
                      )}
                    </div>
                    {offer.status === 'PENDING' && mission.status === 'OPEN' && !hasProposedSlots && (
                      <button
                        disabled={busy}
                        onClick={() => acceptOffer(offer.id)}
                        className="shrink-0 rounded-md bg-moss px-4 py-2 text-sm font-medium text-white hover:bg-moss-dark disabled:opacity-60"
                      >
                        Accepter
                      </button>
                    )}
                  </div>

                  {hasProposedSlots && (
                    <div className="mt-3 rounded-md bg-ochre-light p-3">
                      <p className="text-sm font-medium text-ochre-dark">
                        Vos dates étant flexibles, le jobber vous propose {offer.proposedSlots.length} créneau{offer.proposedSlots.length > 1 ? 'x' : ''} : veuillez choisir.
                      </p>
                      <div className="mt-2 space-y-1.5">
                        {offer.proposedSlots.map((slot, i) => (
                          <label key={i} className="flex items-center gap-2 text-sm text-ink">
                            <input
                              type="radio"
                              name={`slot-${offer.id}`}
                              checked={selectedIndex === i}
                              onChange={() => setSelectedSlots((s) => ({ ...s, [offer.id]: i }))}
                              className="h-4 w-4 accent-moss"
                            />
                            {new Date(`${slot.date}T${slot.startTime}`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {slot.startTime}
                          </label>
                        ))}
                      </div>
                      <button
                        disabled={busy || selectedIndex == null}
                        onClick={() => acceptOffer(offer.id, offer.proposedSlots[selectedIndex])}
                        className="mt-3 w-full rounded-md bg-moss py-2 text-sm font-medium text-white hover:bg-moss-dark disabled:opacity-60"
                      >
                        Confirmer ce créneau et accepter l'offre
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
