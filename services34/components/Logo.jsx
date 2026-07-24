// Traced from the Services 34 reference artwork: a peaked roof sitting over
// a magnifying glass whose lens is a 4-pane window. The roof and window
// stay a fixed dark slate across every variant; only the ring/handle color
// changes per category page (see lib/brand-context.jsx).
const SLATE = '#454B5A';

export default function LogoMark({ color = '#123E7A', className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Roof */}
      <path
        d="M32 100 L100 40 L140 71 L160 71 L178 100"
        fill="none"
        stroke={SLATE}
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Magnifying glass handle */}
      <line x1="124" y1="169" x2="152" y2="197" stroke={color} strokeWidth="20" strokeLinecap="round" />
      {/* Magnifying glass ring */}
      <circle cx="97" cy="141" r="40" fill="none" stroke={color} strokeWidth="20" />
      {/* Window pane inside the ring */}
      <circle cx="97" cy="141" r="19" fill="none" stroke={SLATE} strokeWidth="5" />
      <line x1="97" y1="124" x2="97" y2="158" stroke={SLATE} strokeWidth="5" strokeLinecap="round" />
      <line x1="80" y1="141" x2="114" y2="141" stroke={SLATE} strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
