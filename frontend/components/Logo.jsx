// Magnifying glass "zoomed in" on the brand's yellow B — the glass crops
// the top of the letter, as if it's mid-scan across the wordmark. Sits
// right before the "Jobber" title.
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
      <text
        x="27"
        y="50"
        textAnchor="middle"
        fontFamily="'Inter', sans-serif"
        fontWeight="800"
        fontSize="58"
        fill="#FFB020"
        clipPath="url(#jobber-logo-lens)"
      >
        b
      </text>
      <circle cx="27" cy="27" r="22" fill="none" stroke="#0B66FF" strokeWidth="7" />
      <line x1="42.5" y1="42.5" x2="58" y2="58" stroke="#0B66FF" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}
