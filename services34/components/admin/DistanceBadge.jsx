// Bottom-right corner badge on a mission tile showing the distance from the
// agency's own address (set in "Ma zone d'intervention") — parent element
// must have `relative` for the positioning to anchor correctly.
export default function DistanceBadge({ distanceKm }) {
  if (distanceKm == null) return null;
  const label = distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm} km`;
  return (
    <span className="absolute bottom-2 right-2 z-10 rounded-full bg-blue-600 px-2 py-1 text-xs font-bold text-yellow-300 shadow-md">
      {label}
    </span>
  );
}
