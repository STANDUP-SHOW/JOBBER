// Magnifying glass "zoomed in" on the brand's yellow B — the glass crops
// the top of the letter, as if it's mid-scan across the wordmark. Sits
// right before the "Jobber" title.
export default function Logo({ className = 'h-14 w-14' }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <clipPath id="jobber-logo-lens">
          <circle cx="16" cy="16" r="13" />
        </clipPath>
      </defs>
      <text
        x="16"
        y="28"
        textAnchor="middle"
        fontFamily="'Inter', sans-serif"
        fontWeight="800"
        fontSize="34"
        fill="#FFB020"
        clipPath="url(#jobber-logo-lens)"
      >
        b
      </text>
      <circle cx="16" cy="16" r="15" fill="none" stroke="#0B66FF" strokeWidth="4.5" />
      <line x1="26.5" y1="26.5" x2="43" y2="43" stroke="#0B66FF" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}
