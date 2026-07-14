// Fixed global list of vehicle types a jobber can declare access to.
// Not tied to a skill category — shown as its own "Mes véhicules" section.
export const VEHICLES = [
  { type: 'VOITURE_TOURISME', label: 'Voiture tourisme' },
  { type: 'MINIBUS', label: 'Minibus' },
  { type: 'CAMION_BENNE', label: 'Camion benne' },
  { type: 'REMORQUE', label: 'Remorque' },
  { type: 'GRANDE_REMORQUE', label: 'Grande remorque' },
  { type: 'PETIT_UTILITAIRE_4M3', label: 'Petit utilitaire', capacity: 'Jusqu\'à 4 m³' },
  { type: 'FOURGONNETTE_9M3', label: 'Fourgonnette', capacity: 'Jusqu\'à 9 m³' },
  { type: 'CAMION_15M3', label: 'Camion', capacity: 'Jusqu\'à 15 m³' },
  { type: 'GRAND_CAMION_20M3', label: 'Grand camion', capacity: 'Jusqu\'à 20 m³' },
  { type: 'POIDS_LOURD', label: 'Poids lourd' },
];

// Flat side-view silhouettes distinguishing body shape/length per vehicle
// type; all share a viewBox so they line up in a grid regardless of type.
function Wheels({ positions }) {
  return positions.map((cx) => <circle key={cx} cx={cx} cy="34" r="4.5" fill="currentColor" />);
}

const ICONS = {
  VOITURE_TOURISME: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 30 L11 20 Q14 14 22 14 H38 Q44 14 47 20 L54 24 V30 H8 Z" fill="currentColor" opacity="0.85" />
      <path d="M16 20 L19 15 H35 L39 20 Z" fill="white" opacity="0.5" />
      <Wheels positions={[18, 46]} />
    </svg>
  ),
  MINIBUS: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="44" height="18" rx="4" fill="currentColor" opacity="0.85" />
      <rect x="12" y="16" width="8" height="7" fill="white" opacity="0.5" />
      <rect x="22" y="16" width="8" height="7" fill="white" opacity="0.5" />
      <rect x="32" y="16" width="8" height="7" fill="white" opacity="0.5" />
      <Wheels positions={[18, 42]} />
    </svg>
  ),
  CAMION_BENNE: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 30 L8 18 Q9 15 13 15 H22 V30 Z" fill="currentColor" opacity="0.85" />
      <rect x="13" y="18" width="6" height="6" fill="white" opacity="0.5" />
      <path d="M24 10 H50 L54 20 V30 H24 Z" fill="currentColor" opacity="0.65" />
      <Wheels positions={[16, 44]} />
    </svg>
  ),
  REMORQUE: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 30 L10 28 L14 22 H44 V30 Z" fill="currentColor" opacity="0.7" />
      <Wheels positions={[36]} />
    </svg>
  ),
  GRANDE_REMORQUE: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 30 L8 28 L12 16 H54 V30 Z" fill="currentColor" opacity="0.7" />
      <Wheels positions={[30, 44]} />
    </svg>
  ),
  PETIT_UTILITAIRE_4M3: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 30 L9 18 Q10 13 16 13 H40 Q46 13 46 20 V30 Z" fill="currentColor" opacity="0.85" />
      <rect x="13" y="17" width="7" height="6" fill="white" opacity="0.5" />
      <Wheels positions={[18, 38]} />
    </svg>
  ),
  FOURGONNETTE_9M3: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 30 L7 16 Q8 11 15 11 H46 Q50 11 50 18 V30 Z" fill="currentColor" opacity="0.85" />
      <rect x="11" y="15" width="7" height="6" fill="white" opacity="0.5" />
      <Wheels positions={[17, 41]} />
    </svg>
  ),
  CAMION_15M3: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 30 L5 18 Q6 14 11 14 H18 V30 Z" fill="currentColor" opacity="0.85" />
      <rect x="8" y="18" width="6" height="6" fill="white" opacity="0.5" />
      <rect x="20" y="8" width="34" height="22" fill="currentColor" opacity="0.65" />
      <Wheels positions={[14, 44]} />
    </svg>
  ),
  GRAND_CAMION_20M3: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 30 L3 18 Q4 14 9 14 H15 V30 Z" fill="currentColor" opacity="0.85" />
      <rect x="6" y="18" width="6" height="6" fill="white" opacity="0.5" />
      <rect x="17" y="6" width="40" height="24" fill="currentColor" opacity="0.65" />
      <Wheels positions={[12, 30, 48]} />
    </svg>
  ),
  POIDS_LOURD: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 30 L3 17 Q4 12 10 12 H17 V30 Z" fill="currentColor" opacity="0.9" />
      <rect x="7" y="16" width="7" height="6" fill="white" opacity="0.5" />
      <rect x="19" y="8" width="40" height="22" fill="currentColor" opacity="0.6" />
      <Wheels positions={[13, 30, 48]} />
    </svg>
  ),
};

export default function VehicleIcon({ type, className }) {
  return <div className={className}>{ICONS[type] || null}</div>;
}
