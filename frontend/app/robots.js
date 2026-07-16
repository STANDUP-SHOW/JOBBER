import { SITE_URL } from '../lib/seo';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/account', '/admin', '/messages', '/auth'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
