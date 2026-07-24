import { METIERS } from '../lib/metiers';
import { COMMUNES } from '../lib/communes';
import { SITE_URL } from '../lib/seo';

export default function sitemap() {
  const staticPaths = [
    ...new Set([
      '/', '/bricolage', '/jardinage', '/menage', '/piscine', '/conciergerie',
      '/demande', '/auth/login', '/auth/register',
      ...METIERS.map((m) => m.parentHref),
    ]),
  ];

  const staticEntries = staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : 0.8,
  }));

  const comboEntries = METIERS.flatMap((m) =>
    COMMUNES.map((c) => ({
      url: `${SITE_URL}/${m.slug}/${c.slug}`,
      changeFrequency: 'monthly',
      priority: 0.5,
    })),
  );

  return [...staticEntries, ...comboEntries];
}
