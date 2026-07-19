// Single source of truth for the canonical production domain, used by
// metadata, the sitemap, robots.txt, and JSON-LD across the app. jobber.city
// is the primary domain (matches the app name "Jobber"); jobbers.be only
// redirects here. Update this once DNS is actually connected to Vercel —
// everything else derives from it.
export const SITE_URL = 'https://jobber.city';
export const SITE_NAME = 'Jobber';
