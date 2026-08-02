import { SITE_URL, SITE_NAME } from '../../lib/seo';
import ContactForm from '../../components/ContactForm';

const title = 'Nous contacter';
const description = 'Une question, un problème avec une mission, une suggestion ? Contactez l\'équipe Jobber.';

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: { title, description, url: `${SITE_URL}/contact`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function ContactPage() {
  return (
    <div className="max-w-lg">
      <span className="label-eyebrow text-moss">Contact</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Contacter Jobber</h1>
      <p className="mt-1 text-sm text-slate-500">
        Une question, un problème avec une mission, une suggestion ? Écrivez-nous, nous vous répondons par email.
      </p>
      <div className="mt-6">
        <ContactForm />
      </div>
    </div>
  );
}
