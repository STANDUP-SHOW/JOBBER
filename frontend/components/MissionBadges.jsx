// Shown on mission cards and detail pages when the poster flagged the
// mission at publication time — the two flags are independent, both can
// be set at once.
export default function MissionBadges({ mission, className = '' }) {
  if (!mission?.isUrgent && !mission?.datesFlexible) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
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
    </div>
  );
}
