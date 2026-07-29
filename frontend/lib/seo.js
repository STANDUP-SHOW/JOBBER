// Single source of truth for the canonical production domain, used by
// metadata, the sitemap, robots.txt, and JSON-LD across the app.
// jobberplus.fr is the primary domain for French SEO (.fr ranks better than
// .city for a France-only audience) — jobber.city stays live as a
// secondary/annex domain serving the exact same app, but every canonical
// URL, sitemap entry, and structured-data reference points at jobberplus.fr
// so search engines consolidate ranking signals there instead of splitting
// them across both domains.
export const SITE_URL = 'https://jobberplus.fr';
export const SITE_NAME = 'Jobber';
