import LogoMark, { SERVICES34_DARK_BLUE, SERVICES34_GOLD } from './Logo';

// Renders the platform's real logo artwork when one exists (today: only
// Services 34's), otherwise a plain initials badge — see brandConfig.js's
// `logo: null` comment for why this falls back instead of guessing.
export default function BrandLogo({ brand, className = 'h-10 w-10' }) {
  if (brand.logo === 'services34') {
    return <LogoMark color={SERVICES34_GOLD} className={className} />;
  }
  const initial = brand.shortName?.[0] || '?';
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-brand font-display font-bold text-white ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

export function BrandWordmark({ brand, className = '' }) {
  if (brand.logo === 'services34') {
    return (
      <span className={className}>
        <span style={{ color: SERVICES34_DARK_BLUE }}>Services</span>{' '}
        <span style={{ color: SERVICES34_GOLD }}>34</span>
      </span>
    );
  }
  return <span className={className}>{brand.name}</span>;
}
