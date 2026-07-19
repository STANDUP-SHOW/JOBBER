import VehicleIcon, { VEHICLES } from './VehicleIcon';

function ToolboxIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="8" width="20" height="12" rx="2" />
      <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M2 13h20" />
    </svg>
  );
}

// Shown on mission cards, map popups and detail pages — the poster's
// publication-time choices, always rendered explicitly (e.g. Ponctuel is
// shown just as much as Récurrent) so the full picture is visible at a
// glance in list and map view alike.
export default function MissionBadges({ mission, className = '' }) {
  if (!mission) return null;
  const equipmentNames = (mission.requiredEquipment || []).map((re) => re.equipment.name);
  if (mission.otherEquipmentNote) equipmentNames.push(mission.otherEquipmentNote);
  const hasEquipment = equipmentNames.length > 0;
  const vehicleTypes = mission.requiredVehicleTypes || [];

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {mission.type === 'LESSON' && (
        <span className="rounded-full bg-purple-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
          Cours
        </span>
      )}
      {mission.isUrgent && (
        <span className="rounded-full bg-clay px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
          Urgent
        </span>
      )}
      {mission.datesFlexible && (
        <span className="rounded-full bg-green-600 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
          Dates flexibles
        </span>
      )}
      {mission.isRecurring ? (
        <span className="rounded-full bg-ochre px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-ink">
          Récurrent
        </span>
      ) : (
        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-600">
          Ponctuel
        </span>
      )}
      {hasEquipment && (
        <span
          title={`Matériel requis : ${equipmentNames.join(', ')}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-moss-light text-moss-dark"
        >
          <ToolboxIcon className="h-6 w-6" />
        </span>
      )}
      {vehicleTypes.map((type) => {
        const v = VEHICLES.find((x) => x.type === type);
        return (
          <span
            key={type}
            title={v ? `Véhicule requis : ${v.label}` : 'Véhicule requis'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ochre-light text-ochre-dark"
          >
            <VehicleIcon type={type} className="h-7 w-9" />
          </span>
        );
      })}
    </div>
  );
}
