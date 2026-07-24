// Placeholder wordmark — swap for the real Services 34 logo file once
// supplied. Deliberately has zero visual connection to Jobber.
export default function Logo({ className = 'h-10' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-full aspect-square items-center justify-center rounded-md bg-brand font-display text-lg font-extrabold text-accent">
        34
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight text-brand">
        Services<span className="text-accent-dark"> 34</span>
      </span>
    </div>
  );
}
