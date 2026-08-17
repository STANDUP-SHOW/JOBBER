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

function TruckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="7" width="13" height="10" rx="1" />
      <path d="M14 10h4l3 3v4h-7z" />
      <circle cx="6" cy="18.5" r="1.6" />
      <circle cx="17.5" cy="18.5" r="1.6" />
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

function EuroIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M17 6.5a6.5 6.5 0 1 0 0 11" />
      <path d="M4 10h9M4 14h8" />
    </svg>
  );
}

function GaugeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 14a8 8 0 1 1 16 0" />
      <path d="M12 14 16 9" />
    </svg>
  );
}

function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
      <path d="M16.5 8.2a3.2 3.2 0 1 1 0-6.4" />
      <path d="M15 13.6c3.1.4 5.5 2.5 5.5 5.4" />
    </svg>
  );
}

function ShieldCheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3 4.5 5.5V11c0 5 3.2 8.4 7.5 10 4.3-1.6 7.5-5 7.5-10V5.5L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function SendIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  );
}

function ChatBubbleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function BoltIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
    </svg>
  );
}

function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function TagIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2 2 12l10 10 10-10-10-10Z" />
      <circle cx="8" cy="8" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

function HeadsetIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <rect x="2" y="13" width="5" height="7" rx="2" />
      <rect x="17" y="13" width="5" height="7" rx="2" />
      <path d="M19 20a5 5 0 0 1-5 3h-2" />
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
  OPEN: { text: 'Publiée', cls: 'bg-moss-light text-moss-dark' },
  ASSIGNED: { text: 'Attribuée', cls: 'bg-ochre-light text-ochre-dark' },
  IN_PROGRESS: { text: 'En cours', cls: 'bg-ochre-light text-ochre-dark' },
  COMPLETED: { text: 'Terminée', cls: 'bg-slate-200 text-slate-600' },
  CANCELLED: { text: 'Annulée', cls: 'bg-slate-200 text-slate-600' },
};

const DIFFICULTY_LABEL = {
  FACILE: { text: 'Facile', caption: 'Accessible à tous' },
  MOYEN: { text: 'Moyen', caption: 'Quelques compétences utiles' },
  DIFFICILE: { text: 'Difficile', caption: 'Expertise recommandée' },
};

// Card shell shared by every block below — plain white rounded card with a
// consistent header (icon in a tinted circle + title), used throughout so
// the page reads as one coherent system rather than a stack of one-off
// components.
function Card({ icon: Icon, iconCls, title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 ${className}`}>
      {title && (
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconCls || 'bg-moss-light text-moss-dark'}`}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
        </div>
      )}
      <div className={title ? 'mt-4' : ''}>{children}</div>
    </div>
  );
}

function StatCard({ icon: Icon, iconCls, label, value, caption }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconCls}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="text-xs font-medium text-slate-500">{label}</span>
      </div>
      <div className="mt-2 font-display text-xl font-bold text-ink">{value}</div>
      <div className="text-xs text-slate-400">{caption}</div>
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
  const [contactBusy, setContactBusy] = useState(false);
  const [contactError, setContactError] = useState('');

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

  async function askQuestion() {
    if (!user) return router.push('/auth/login');
    setContactBusy(true); setContactError('');
    try {
      const { conversation } = await api.startConversation({ missionId: id, providerId: user.id }, token);
      router.push(`/messages/${conversation.id}`);
    } catch (err) { setContactError(err.message); setContactBusy(false); }
  }

  if (error && !mission) return <p className="text-clay">{error}</p>;
  if (!mission) return <p className="text-slate-400">Chargement…</p>;

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
  const difficulty = mission.difficulty ? DIFFICULTY_LABEL[mission.difficulty] : null;

  const equipmentNames = (mission.requiredEquipment || []).map((re) => re.equipment.name);
  const vehicleEntries = (mission.requiredVehicleTypes || []).map((t) => ({ type: t, label: VEHICLES.find((v) => v.type === t)?.label || t }));
  const hasEquipment = equipmentNames.length > 0 || mission.otherEquipmentNote;
  const hasVehicle = vehicleEntries.length > 0 || mission.otherVehicleNote;
  const hasPpe = (mission.requiredPpe || []).length > 0;
  const hasMachine = (mission.requiredMachines || []).length > 0;
  const requiredBadgeKeys = (mission.requiredBadges || []).filter((k) => BADGE_CATALOG[k]);
  const hasBadges = requiredBadgeKeys.length > 0;
  const isMechanicVehicle = mission.category?.slug === 'mecanique' && MECHANIC_VEHICLE_TYPES.includes(mission.service?.name);
  const detailEntries = (mission.service?.detailFields || [])
    .map((field) => ({ field, display: formatDetailValue(field, (mission.details || {})[field.key]) }))
    .filter((e) => e.display != null);

  return (
    <div className="mx-auto max-w-4xl">
      <MissionNavBar backHref={navList.href} nextId={nextMissionId} />

      {/* Header: title, status, badges — sets the scene before anything else */}
      <div className="mt-5">
        <h1 className="font-display text-2xl font-semibold text-ink md:text-3xl">{mission.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {status && <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.cls}`}>{status.text}</span>}
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {mission.client?.accountKind === 'COMPANY' ? (mission.client.companyType === 'CORPORATE' ? 'Corporate' : 'Entreprise') : 'Particulier'}
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {mission.isRecurring ? 'Mission récurrente' : 'Mission ponctuelle'}
          </span>
          <MissionBadges mission={mission} />
        </div>
        <p className="mt-3 text-sm text-slate-600">{mission.description}</p>
      </div>

      {/* 1. Carte */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        {isTransportMission ? (
          <MissionRouteMap
            origin={{ lat: mission.lat, lng: mission.lng }}
            destination={{ lat: mission.dropoffLat, lng: mission.dropoffLng }}
          />
        ) : (
          <MissionRouteMap destination={mission.lat != null && mission.lng != null ? { lat: mission.lat, lng: mission.lng } : null} />
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-paper px-4 py-3">
          <div>
            <div className="text-xs font-medium text-slate-500">Adresse de la mission</div>
            <div className="text-sm font-medium text-ink">{displayAddress(mission.address)}</div>
          </div>
          {mission.distanceKm != null && (
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink shadow-sm">
              {mission.distanceKm < 1 ? `${Math.round(mission.distanceKm * 1000)} m` : `${mission.distanceKm} km`} depuis vous
            </span>
          )}
        </div>
        {isTransportMission && (
          <div className="border-t border-slate-200 bg-paper px-4 py-3 text-sm text-ink">
            Arrivée : {displayAddress(mission.dropoffAddress)}
          </div>
        )}
      </div>

      {/* 2. Rémunération / durée / date / difficulté / candidatures */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {mission.isGetMission ? (
          <StatCard icon={EuroIcon} iconCls="bg-green-100 text-green-700" label="Rémunération" value={`${mission.getMissionPrice} €`} caption="Tarif fixe" />
        ) : (
          <StatCard icon={EuroIcon} iconCls="bg-blue-100 text-blue-600" label="Rémunération" value={`~${indicativePrice} €`} caption="Estimation" />
        )}
        <StatCard icon={ClockIcon} iconCls="bg-purple-100 text-purple-600" label="Durée estimée" value={`${mission.estimatedHours} h`} caption="Environ" />
        <StatCard icon={CalendarIcon} iconCls="bg-ochre-light text-ochre-dark" label="Date souhaitée" value={dateLabel} caption={endDateLabel ? `Jusqu'au ${endDateLabel}` : fmtTime(start)} />
        <StatCard
          icon={GaugeIcon}
          iconCls="bg-moss-light text-moss-dark"
          label="Difficulté"
          value={difficulty ? difficulty.text : 'Non précisée'}
          caption={difficulty ? difficulty.caption : '—'}
        />
        <StatCard icon={UsersIcon} iconCls="bg-indigo-100 text-indigo-600" label="Candidatures" value={applicantCount} caption="Déjà reçues" />
      </div>

      {/* 3. Détail mission */}
      <Card title="Détails de la mission" className="mt-6">
        <div className="space-y-3 text-sm text-ink">
          {recurrenceLabel(mission) && (
            <div className="flex items-center gap-2 text-slate-600">
              <RepeatIcon className="h-4 w-4 shrink-0 text-slate-400" />
              Mission à réaliser {recurrenceLabel(mission)}
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-600">
            <ClockIcon className="h-4 w-4 shrink-0 text-slate-400" />
            {fmtTime(start)} à {fmtTime(end)}
          </div>
        </div>

        {isMechanicVehicle ? (
          detailEntries.length > 0 && (
            <div className="mt-4 rounded-lg bg-moss-light p-4">
              <div className="flex items-center gap-2">
                <MechanicVehicleIcon type={mission.service.name} className="h-8 w-12 shrink-0" />
                <span className="font-display text-sm font-bold uppercase tracking-wide text-moss-dark">{mission.service.name}</span>
              </div>
              <p className="mt-2.5 text-sm font-medium text-ink">{detailEntries.map((e) => e.display).join('  —  ')}</p>
            </div>
          )
        ) : (
          detailEntries.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Précisions sur « {mission.service?.name} »</h3>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {detailEntries.map(({ field, display }) => (
                  <div key={field.key}>
                    <dt className="text-xs text-slate-400">{field.label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-ink">{display}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        )}

        {mission.photos?.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {mission.photos.map((url) => (
              <img key={url} src={url} alt="" className="h-28 w-28 shrink-0 rounded-lg object-cover" />
            ))}
          </div>
        )}
      </Card>

      {/* 4. Outils requis / Véhicule requis */}
      {(hasEquipment || hasVehicle || hasPpe || hasMachine) && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {(hasEquipment || hasPpe || hasMachine) && (
            <Card icon={ToolboxIcon} iconCls="bg-moss-light text-moss-dark" title="Outils requis">
              <div className="space-y-4">
                {hasEquipment && (
                  <div>
                    {mission.equipmentProvidedByCompany && (
                      <div className="mb-1.5 text-xs font-medium text-moss-dark">Fourni par l'entreprise</div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {equipmentNames.map((name) => (
                        <span key={name} className="rounded-full bg-moss-light px-3 py-1 text-sm text-moss-dark">{name}</span>
                      ))}
                      {mission.otherEquipmentNote && (
                        <span className="rounded-full bg-moss-light px-3 py-1 text-sm text-moss-dark">{mission.otherEquipmentNote}</span>
                      )}
                    </div>
                  </div>
                )}
                {hasPpe && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Machine à utiliser sur place</span>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {mission.requiredMachines.map((name) => (
                        <span key={name} className="rounded-full bg-moss-light px-3 py-1 text-sm text-moss-dark">{name}</span>
                      ))}
                    </div>
                  </div>
                )}
                {!hasEquipment && !hasPpe && !hasMachine && (
                  <p className="text-sm text-slate-400">Aucun outil spécifique requis.</p>
                )}
              </div>
            </Card>
          )}

          <Card icon={TruckIcon} iconCls="bg-ochre-light text-ochre-dark" title="Véhicule requis">
            {hasVehicle ? (
              <div className="flex flex-wrap gap-4">
                {vehicleEntries.map(({ type, label }) => (
                  <div key={type} className="flex flex-col items-center gap-1.5">
                    <span className="flex h-12 w-16 items-center justify-center rounded-lg bg-ochre-light text-ochre-dark">
                      <VehicleIcon type={type} className="h-8 w-10" />
                    </span>
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
                {mission.otherVehicleNote && (
                  <span className="self-center rounded-full bg-ochre-light px-3 py-1 text-sm text-ochre-dark">{mission.otherVehicleNote}</span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Pas de véhicule spécifique nécessaire.</p>
            )}
          </Card>
        </div>
      )}

      {/* 5. Client — informatif uniquement, pas de contact ni de profil avant candidature */}
      <Card title="Client" className="mt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-moss-light font-display text-lg text-moss-dark">
            {mission.client?.avatarUrl ? (
              <img src={mission.client.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              posterName(mission)?.[0]
            )}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-base font-semibold text-ink">{posterName(mission)}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                {mission.client?.accountKind === 'COMPANY' ? (mission.client.companyType === 'CORPORATE' ? 'Corporate' : 'Entreprise') : 'Particulier'}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              {mission.client?.createdAt
                ? `Membre depuis ${new Date(mission.client.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                : `Publié ${timeAgo(mission.createdAt)}`}
            </div>
          </div>
        </div>
      </Card>

      {/* 6. Qualités requises */}
      {hasBadges && (
        <Card title="Qualités requises" className="mt-6">
          <div className="grid gap-2 sm:grid-cols-2">
            {requiredBadgeKeys.map((key) => {
              const badge = BADGE_CATALOG[key];
              return (
                <div key={key} className="flex items-start gap-2.5 rounded-lg bg-blue-600 p-3">
                  <span className="text-lg leading-none">{badge.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-yellow-300">{badge.name}</div>
                    <div className="text-xs text-yellow-100">{badge.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {error && <p className="mt-6 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}
      {contactError && <p className="mt-4 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{contactError}</p>}

      {quotaNotice && (
        <div className="mt-6 rounded-md bg-ochre/10 px-4 py-3 text-sm text-ink">
          <p>{quotaNotice}</p>
          <div className="mt-2 flex gap-3">
            <a href="/dashboard" className="font-medium text-moss">Voir mes réservations</a>
            <a href="/account/subscription" className="font-medium text-moss">Passer à Manager Holder</a>
          </div>
        </div>
      )}

      {/* 7. Postuler */}
      {!isOwner && mission.status === 'OPEN' && (
        <div className="mt-6 rounded-2xl bg-ink p-6 text-white">
          {alreadyApplied ? (
            <p className="text-sm font-medium text-moss-light">✓ Votre candidature a été envoyée — vous serez prévenu dès la réponse du client.</p>
          ) : (
            <>
              <h2 className="font-display text-lg font-semibold">Intéressé par cette mission ?</h2>
              <p className="mt-1 text-sm text-white/70">Postulez dès maintenant et recevez une réponse rapide du client.</p>

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  [BoltIcon, 'Réponse rapide', 'Du client'],
                  [LockIcon, 'Paiement sécurisé', 'Via la plateforme'],
                  [TagIcon, 'Aucun frais caché', 'Vous gardez 100%'],
                  [HeadsetIcon, 'Support dédié', 'En cas de besoin'],
                ].map(([Icon, label, sub]) => (
                  <div key={label} className="flex items-start gap-2">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />
                    <div className="text-xs">
                      <div className="font-semibold text-white">{label}</div>
                      <div className="text-white/60">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                {mission.isGetMission ? (
                  <button
                    onClick={claimGetMission}
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-green-500 py-3.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
                  >
                    <SendIcon className="h-4 w-4" /> {busy ? 'Un instant…' : 'GET MISSION →'}
                  </button>
                ) : (
                  <button
                    onClick={openApply}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ochre py-3.5 text-sm font-semibold text-ink hover:opacity-90"
                  >
                    <SendIcon className="h-4 w-4" /> Postuler à cette mission
                  </button>
                )}
                <button
                  onClick={askQuestion}
                  disabled={contactBusy}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/30 py-3.5 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
                >
                  <ChatBubbleIcon className="h-4 w-4" /> {contactBusy ? 'Un instant…' : 'Poser une question au client'}
                </button>
              </div>
              <p className="mt-3 text-center text-xs text-white/50 sm:text-left">
                En postulant, vous acceptez les conditions d'utilisation de Jobber+.
              </p>
            </>
          )}
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

      {isOwner && (
        <section className="mt-8">
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
