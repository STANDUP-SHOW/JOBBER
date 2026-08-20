// One shared admin codebase, N corporate platforms — this map is the only
// place a new platform's branding needs to be registered. Add a domain here
// (matching the User.agencyDomain used on the backend, see backend/src/utils/agency.js)
// and its admin back-office is instantly live, no other code changes needed.
//
// `logo: null` means no bespoke artwork exists yet for that platform — the
// UI falls back to a plain initials badge (see BrandLogo.jsx) rather than
// guessing at a design. Swap in a real <LogoMark> component once art exists,
// the same way Services 34's is wired below.
const BRANDS = {
  'services34.fr': {
    name: 'Services 34',
    shortName: 'Services34',
    logo: 'services34',
  },
  'batijob.fr': {
    name: 'Batijob',
    shortName: 'Batijob',
    logo: null,
  },
  'restaujob.fr': {
    name: 'Restaujob',
    shortName: 'Restaujob',
    logo: null,
  },
  'salonadomicile.com': {
    name: 'Salon à Domicile',
    shortName: 'Salon à Domicile',
    logo: null,
  },
  'mecanow.fr': {
    name: 'Mecanow',
    shortName: 'Mecanow',
    logo: null,
  },
};

const DEFAULT_BRAND = { name: 'Jobber Corporate', shortName: 'Corporate', logo: null };

// Strips a leading "admin." or "www." and matches against BRANDS — works
// whether the back-office is served on admin.batijob.fr or batijob.fr
// directly, and whether or not "www" is present.
export function getBrandForHost(hostname) {
  if (!hostname) return DEFAULT_BRAND;
  const bare = hostname.replace(/^admin\./, '').replace(/^www\./, '');
  return BRANDS[bare] || DEFAULT_BRAND;
}

export { BRANDS, DEFAULT_BRAND };
