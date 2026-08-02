import { SITE_URL, SITE_NAME } from '../../lib/seo';
import ContactForm from '../../components/ContactForm';

const title = 'Nous contacter';
const description = "Une question, une demande particulière ? Contactez l'équipe Services 34.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: { title, description, url: `${SITE_URL}/contact`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-lg">
      <span className="text-sm font-semibold uppercase tracking-wide text-brand">Contact</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Contacter Services 34</h1>
      <p className="mt-1 text-sm text-slate-500">
        Une question, une demande particulière ? Écrivez-nous, nous vous répondons par email.
      </p>
      <div className="mt-6">
        <ContactForm />
      </div>
    </div>
  );
}
