import Image from 'next/image';
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
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div className="order-2 md:order-1">
          <span className="text-sm font-semibold uppercase tracking-wide text-brand">Contact</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Contacter Services 34</h1>
          <p className="mt-1 text-sm text-slate-500">
            Une question, une demande particulière ? Écrivez-nous, nous vous répondons par email.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
        <div className="order-1 md:order-2">
          <div className="overflow-hidden rounded-2xl bg-accent-light">
            <Image
              src="/images/contact/standardiste.png"
              alt="Illustration d'une standardiste accueillant votre appel"
              width={1200}
              height={1200}
              className="h-full w-full object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
