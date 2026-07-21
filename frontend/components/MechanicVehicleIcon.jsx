// Bold flat side-view icons for the 4 vehicle types repaired in "Mécanique"
// missions — same visual language as VehicleIcon.jsx (thick ink outline,
// brand blue body, brand yellow accent) so they read as one icon family
// across mission badges. Keyed by the Mécanique service's exact name.
const BLUE = '#0B66FF';
const YELLOW = '#FFB020';
const INK = '#111114';
const S = { stroke: INK, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' };

function Wheel({ cx, r = 5.5 }) {
  return (
    <g>
      <circle cx={cx} cy="34" r={r} fill={INK} />
      <circle cx={cx} cy="34" r={r - 2.5} fill="#FFFFFF" />
      <circle cx={cx} cy="34" r={r - 4.2} fill={INK} />
    </g>
  );
}

const ICONS = {
  Voiture: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 29 L9 21 Q12 15 20 15 H39 Q45 15 48 21 L56 25 V29 Z" fill={BLUE} {...S} />
      <path d="M6 29 H56 V23 H6 Z" fill={YELLOW} {...S} />
      <path d="M15 21 L18 17 H35 L39 21 Z" fill="#FFFFFF" {...S} strokeWidth="1.5" />
      <Wheel cx={17} />
      <Wheel cx={47} />
    </svg>
  ),
  Camion: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 30 L4 18 Q4 14 9 14 H19 V30 Z" fill={BLUE} {...S} />
      <path d="M4 30 H19 V23 H4 Z" fill={YELLOW} {...S} />
      <path d="M8 17 H15 V23 H8 Z" fill="#FFFFFF" {...S} strokeWidth="1.5" />
      <path d="M21 8 H55 Q57 8 57 10 V30 H21 Z" fill={YELLOW} {...S} />
      <path d="M27 12 V26 M34 12 V26 M41 12 V26" stroke={INK} strokeWidth="1.5" opacity="0.45" />
      <Wheel cx={14} />
      <Wheel cx={45} />
    </svg>
  ),
  Moto: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 30 L23 19 L33 19 L33 13 L41 13" fill="none" {...S} />
      <path d="M33 19 L45 24 L48 30" fill="none" {...S} />
      <rect x="27" y="20" width="12" height="5" rx="2" fill={BLUE} {...S} />
      <Wheel cx={16} />
      <Wheel cx={48} />
    </svg>
  ),
  Scooter: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 30 H30 Q34 30 36 26 L40 18" fill="none" {...S} />
      <path d="M18 30 V22 Q18 16 24 14 L28 12" fill="none" {...S} />
      <rect x="30" y="21" width="12" height="5" rx="2" fill={YELLOW} {...S} />
      <path d="M40 18 L46 18" {...S} />
      <Wheel cx={18} r={5} />
      <Wheel cx={45} r={5} />
    </svg>
  ),
};

export const MECHANIC_VEHICLE_TYPES = ['Voiture', 'Scooter', 'Moto', 'Camion'];

export default function MechanicVehicleIcon({ type, className }) {
  return <div className={className}>{ICONS[type] || null}</div>;
}
