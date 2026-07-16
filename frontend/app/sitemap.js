import { SITE_URL } from '../lib/seo';
import { SEO_CATEGORIES } from '../lib/seoCategories';
import { SEO_CITIES } from '../lib/seoCities';

export default function sitemap() {
  const now = new Date();

  const staticRoutes = ['', '/missions'].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: path === '' ? 1 : 0.7,
  }));

  const categoryRoutes = Object.keys(SEO_CATEGORIES).map((slug) => ({
    url: `${SITE_URL}/services/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const cityRoutes = Object.keys(SEO_CATEGORIES).flatMap((categorySlug) =>
    SEO_CITIES.map((city) => ({
      url: `${SITE_URL}/services/${categorySlug}/${city.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  );

  return [...staticRoutes, ...categoryRoutes, ...cityRoutes];
}
