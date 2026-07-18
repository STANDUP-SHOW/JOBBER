// Shown on mission cards and detail pages when the poster flagged the
// mission at publication time — the flags are independent, any can be set
// at once.
export default function MissionBadges({ mission, className = '' }) {
  if (!mission?.isUrgent && !mission?.datesFlexible && !mission?.isRecurring && mission?.type !== 'LESSON') return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
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
      {mission.isRecurring && (
        <span className="rounded-full bg-ochre px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-ink">
          Récurrente
        </span>
      )}
    </div>
  );
}
