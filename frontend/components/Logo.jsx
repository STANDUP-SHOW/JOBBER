// Magnifying glass "searching for a jobber" — a yellow person glyph (head +
// shoulders) inside the blue lens, shoulders cropped by the lens's own
// bottom edge as if mid-scan. Sits right before the "Jobber" title.
//
// viewBox is 64x64 (not tight to the ring) so the stroke — which extends
// past the circle's own radius — has room to breathe without getting
// clipped by the SVG's own edge.
export default function Logo({ className = 'h-14 w-14' }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <clipPath id="jobber-logo-lens">
          <circle cx="27" cy="27" r="17" />
        </clipPath>
      </defs>
      <g fill="#FFB020" clipPath="url(#jobber-logo-lens)">
        <circle cx="27" cy="19.5" r="6.5" />
        <circle cx="27" cy="39" r="13" />
      </g>
      <circle cx="27" cy="27" r="22" fill="none" stroke="#0B66FF" strokeWidth="7" />
      <line x1="42.5" y1="42.5" x2="58" y2="58" stroke="#0B66FF" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}
