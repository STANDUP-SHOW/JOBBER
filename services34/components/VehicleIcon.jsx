// Same icon set as Jobber's, recolored to Services 34's own brand palette
// (navy/gold instead of Jobber's blue/yellow) — no shared visual identity.
export const VEHICLES = [
  { type: 'VOITURE_TOURISME', label: 'Voiture tourisme' },
  { type: 'MINIBUS', label: 'Minibus' },
  { type: 'CAMION_BENNE', label: 'Camion benne' },
  { type: 'REMORQUE', label: 'Remorque' },
  { type: 'GRANDE_REMORQUE', label: 'Grande remorque' },
  { type: 'PETIT_UTILITAIRE_4M3', label: 'Petit utilitaire', capacity: 'Jusqu\'à 4 m³' },
  { type: 'FOURGONNETTE_9M3', label: 'Fourgonnette', capacity: 'Jusqu\'à 9 m³' },
  { type: 'CAMION_15M3', label: 'Camion', capacity: 'Jusqu\'à 15 m³' },
];

const BLUE = '#1E4FA3';
const BLUE_DARK = '#163B7A';
const YELLOW = '#F5B400';
const INK = '#101828';
const S = { stroke: INK, strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' };

function Wheel({ cx }) {
  return (
    <g>
      <circle cx={cx} cy="34" r="5.5" fill={INK} />
      <circle cx={cx} cy="34" r="3" fill="#FFFFFF" />
      <circle cx={cx} cy="34" r="1.3" fill={INK} />
    </g>
  );
}

function Wheels({ positions }) {
  return positions.map((cx) => <Wheel key={cx} cx={cx} />);
}

function Glass({ x, y, w, h }) {
  return <rect x={x} y={y} width={w} height={h} rx="1" fill="#FFFFFF" {...S} strokeWidth="1.5" />;
}

const ICONS = {
  VOITURE_TOURISME: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 29 L9 21 Q12 15 20 15 H39 Q45 15 48 21 L56 25 V29 Z" fill={BLUE} {...S} />
      <path d="M6 29 H56 V23 H6 Z" fill={YELLOW} {...S} />
      <path d="M15 21 L18 17 H35 L39 21 Z" fill="#FFFFFF" {...S} strokeWidth="1.5" />
      <Wheels positions={[17, 47]} />
    </svg>
  ),
  MINIBUS: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="11" width="46" height="19" rx="4" fill={BLUE} {...S} />
      <rect x="8" y="22" width="46" height="8" fill={YELLOW} {...S} />
      <Glass x="12.5" y="15" w="7.5" h="7" />
      <Glass x="23" y="15" w="7.5" h="7" />
      <Glass x="33.5" y="15" w="7.5" h="7" />
      <Wheels positions={[18, 44]} />
    </svg>
  ),
  CAMION_BENNE: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 30 L5 17 Q5 14 8 14 H21 V30 Z" fill={BLUE} {...S} />
      <path d="M5 30 H21 V23 H5 Z" fill={YELLOW} {...S} />
      <Glass x="9" y="17" w="8" h="6" />
      <path d="M23 11 H49 Q52 11 52 14 V30 H23 Z" fill={YELLOW} {...S} />
      <Wheels positions={[15, 44]} />
    </svg>
  ),
  REMORQUE: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 30 L8 30 L11 20 H44 V30 Z" fill={YELLOW} {...S} />
      <path d="M11 20 H44 V25 H11 Z" fill={BLUE_DARK} opacity="0.18" />
      <path d="M2 27 H8" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <Wheels positions={[36]} />
    </svg>
  ),
  GRANDE_REMORQUE: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 30 L7 30 L10 15 H54 V30 Z" fill={YELLOW} {...S} />
      <path d="M10 15 H54 V21 H10 Z" fill={BLUE_DARK} opacity="0.18" />
      <path d="M1 26 H7" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <Wheels positions={[30, 45]} />
    </svg>
  ),
  PETIT_UTILITAIRE_4M3: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 30 L8 19 Q9 13 16 13 H39 Q46 13 46 20 V30 Z" fill={BLUE} {...S} />
      <path d="M7 30 H46 V22 H7 Z" fill={YELLOW} {...S} />
      <Glass x="12" y="16" w="9" h="6" />
      <Wheels positions={[18, 38]} />
    </svg>
  ),
  FOURGONNETTE_9M3: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 30 L6 17 Q7 10 15 10 H45 Q50 10 50 17 V30 Z" fill={BLUE} {...S} />
      <path d="M5 30 H50 V21 H5 Z" fill={YELLOW} {...S} />
      <Glass x="10" y="14" w="9" h="7" />
      <Wheels positions={[17, 41]} />
    </svg>
  ),
  CAMION_15M3: (
    <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 30 L4 18 Q4 14 9 14 H19 V30 Z" fill={BLUE} {...S} />
      <path d="M4 30 H19 V23 H4 Z" fill={YELLOW} {...S} />
      <Glass x="8" y="17" w="7" h="6" />
      <path d="M21 8 H55 Q57 8 57 10 V30 H21 Z" fill={YELLOW} {...S} />
      <Wheels positions={[14, 45]} />
    </svg>
  ),
};

export default function VehicleIcon({ type, className }) {
  return <div className={className}>{ICONS[type] || null}</div>;
}
