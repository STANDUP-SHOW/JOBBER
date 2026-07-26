'use client';

import { VEHICLES } from '../VehicleIcon';

const BADGE_STYLES = {
  clay: 'bg-clay/10 text-clay',
  green: 'bg-green-100 text-green-700',
  accent: 'bg-accent-light text-accent-dark',
  brand: 'bg-brand-light text-brand-dark',
  slate: 'bg-slate-100 text-slate-600',
};

function Badge({ children, color }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STYLES[color]}`}>{children}</span>;
}

// Everything the requester checked at demande time — address, options
// (Urgent, Dates flexibles, Travail en hauteur, Récurrent), matériel and
// véhicule requis — shown on the mission card so nothing gets lost between
// creation and the various admin lists.
export default function MissionInfoBadges({ mission, showAddress = true }) {
  const vehicleLabels = (mission.requiredVehicleTypes || []).map((t) => VEHICLES.find((v) => v.type === t)?.label || t);
  const equipmentNames = (mission.requiredEquipment || []).map((re) => re.equipment?.name).filter(Boolean);

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {showAddress && mission.address && <span className="text-xs text-slate-500">📍 {mission.address}</span>}
      {mission.isUrgent && <Badge color="clay">Urgent</Badge>}
      {mission.datesFlexible && <Badge color="green">Dates flexibles</Badge>}
      {mission.workAtHeight === true && <Badge color="clay">Travail en hauteur</Badge>}
      {mission.isRecurring && <Badge color="accent">Récurrent</Badge>}
      {vehicleLabels.map((label) => <Badge key={label} color="brand">🚚 {label}</Badge>)}
      {mission.otherVehicleNote && <Badge color="brand">🚚 {mission.otherVehicleNote}</Badge>}
      {equipmentNames.map((name) => <Badge key={name} color="slate">🧰 {name}</Badge>)}
      {mission.otherEquipmentNote && <Badge color="slate">🧰 {mission.otherEquipmentNote}</Badge>}
    </div>
  );
}
