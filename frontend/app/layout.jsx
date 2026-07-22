import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import BottomNav from '../components/BottomNav';
import Footer from '../components/Footer';
import { SITE_URL, SITE_NAME } from '../lib/seo';

const description =
  "Trouvez un professionnel de confiance près de chez vous : femme de ménage, bricoleur, jardinier, électricien, plombier, baby-sitter et bien plus. Publiez votre besoin gratuitement, comparez les offres, payez en toute sécurité.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Services à domicile partout en France`, template: `%s | ${SITE_NAME}` },
  description,
  keywords: [
    'femme de ménage', 'bricolage', 'électricien', 'jardinier', 'plombier', 'baby-sitter',
    'aide à domicile', 'déménagement', 'services à domicile', 'trouver un prestataire',
  ],
  openGraph: {
    title: `${SITE_NAME} — Services à domicile partout en France`,
    description,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: `${SITE_NAME} — Services à domicile`, description },
  robots: { index: true, follow: true },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  description,
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="font-body">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <AuthProvider>
          <main className="mx-auto max-w-6xl px-6 pt-6">{children}</main>
          <Footer />
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
