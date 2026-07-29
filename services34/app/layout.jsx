import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import { BrandProvider } from '../lib/brand-context';
import SiteChrome from '../components/SiteChrome';
import { SITE_URL, SITE_NAME } from '../lib/seo';

const description =
  "Bricolage, ménage, jardinage, entretien de piscine et conciergerie à Béziers, Agde, Vias, Marseillan et alentours. Des agents de confiance, vérifiés, pour tous vos services à domicile.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Services à domicile à Béziers et alentours`, template: `%s | ${SITE_NAME}` },
  description,
  keywords: [
    'services à la personne Béziers', 'bricolage Béziers', 'ménage Agde', 'jardinage Vias',
    'entretien piscine Marseillan', 'conciergerie Hérault',
  ],
  openGraph: {
    title: `${SITE_NAME} — Services à domicile à Béziers et alentours`,
    description,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'fr_FR',
    type: 'website',
  },
  robots: { index: true, follow: true },
  verification: { google: 'OYz2W5F36T0DWWvWddL9dHp9D1dHKFSR1IwsWzG0aJw' },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: SITE_NAME,
  url: SITE_URL,
  description,
  areaServed: ['Béziers', 'Agde', 'Vias', 'Marseillan'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="font-body">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <BrandProvider>
          <AuthProvider>
            <SiteChrome>{children}</SiteChrome>
          </AuthProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
