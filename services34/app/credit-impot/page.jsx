import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';
import TaxCreditSimulator from '../../components/TaxCreditSimulator';

const title = "Crédit d'impôt sur les services à domicile — Services 34";
const description =
  "50 % de vos dépenses en ménage, bricolage et jardinage réalisées avec Services 34 vous sont remboursés par l'État sous forme de crédit d'impôt. Découvrez comment ça marche et simulez votre économie.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/credit-impot` },
  openGraph: { title, description, url: `${SITE_URL}/credit-impot`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const STEPS = [
  ['1', 'Un agent Services 34 intervient chez vous', 'Pour un service éligible : ménage, jardinage, ou petit bricolage (2 h ou moins par intervention).'],
  ['2', 'Vous le payez via Services 34', 'Le paiement passe par la plateforme, qui gère la déclaration et le prélèvement des charges sociales à votre place.'],
  ['3', 'Vous reportez la dépense sur votre impôt', "Le montant total de l'année s'inscrit dans la case 7DB de votre déclaration de revenus."],
  ['4', "L'État vous rembourse 50 %", "Sous forme de crédit d'impôt : une déduction si vous êtes imposable, un chèque sinon."],
];

const ELIGIBLE_CATEGORIES = [
  ['Ménage', '/menage'],
  ['Bricolage (2 h ou moins)', '/bricolage'],
  ['Jardinage', '/jardinage'],
];

const FAQ = [
  {
    q: "Le crédit d'impôt, qu'est-ce que c'est exactement ?",
    a: "Dès qu'un agent vous rend un service à domicile, même ponctuellement, vous devenez son employeur au sens fiscal. Pour encourager la déclaration de ces emplois plutôt que le travail non déclaré, l'État a mis en place un avantage fiscal qui vous rembourse la moitié de ce que vous avez dépensé en services à la personne au cours de l'année.",
  },
  {
    q: "Quelle différence entre crédit d'impôt et réduction d'impôt ?",
    a: "Une réduction d'impôt fait baisser ce que vous devez, mais ne vous rapporte rien si vous n'êtes pas imposable. Un crédit d'impôt, lui, vous est versé dans tous les cas : il diminue votre impôt si vous en payez, et l'administration vous envoie la différence par chèque ou virement si vous n'êtes pas imposable.",
  },
  {
    q: 'Qui peut en bénéficier ?',
    a: "Toute personne domiciliée fiscalement en France, quel que soit son statut — salarié, indépendant, retraité, non imposable. Ça vaut aussi pour une résidence secondaire en France.",
  },
  {
    q: "Quel est le plafond du crédit d'impôt ?",
    a: "Vous dépensez ce que vous voulez, mais le crédit d'impôt n'est calculé que sur 12 000 € de dépenses par an au maximum — soit 6 000 € remboursés au maximum. Ce plafond augmente de 1 500 € par enfant à charge ou par personne de plus de 65 ans dans le foyer, jusqu'à 15 000 €.",
  },
  {
    q: 'Le jardinage et le bricolage sont-ils vraiment éligibles ?',
    a: "Oui pour l'entretien courant — tonte, taille, désherbage, petites réparations — mais avec des plafonds spécifiques : le petit bricolage est limité à 2 heures par intervention et 500 € de crédit d'impôt par an, le jardinage à 5 000 € de dépenses par an. Les gros travaux nécessitant un artisan qualifié ne sont pas éligibles.",
  },
  {
    q: "La conciergerie ou l'entretien de piscine sont-ils éligibles ?",
    a: "Non — ces prestations ne font pas partie des services à la personne définis par l'article D7231-1 du Code du travail et n'ouvrent donc pas droit au crédit d'impôt. Seuls le ménage, le jardinage et le petit bricolage le sont.",
  },
  {
    q: "Comment récupérer mon crédit d'impôt ?",
    a: "Conservez vos factures Services 34 pour les prestations éligibles réglées dans l'année. Une attestation fiscale annuelle récapitulative vous est transmise, à reporter dans la case 7DB de votre déclaration de revenus.",
  },
];

export default function CreditImpotPage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-brand/20 bg-brand-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          Crédit d'impôt
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          50 % de vos dépenses vous sont remboursées par l'État.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Le ménage, le jardinage et le petit bricolage réalisés avec Services 34 ouvrent droit à un crédit d'impôt
          de 50 %. Simulez votre économie ci-dessous.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-lg">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Simulez votre crédit d'impôt</h2>
        <div className="mt-6">
          <TaxCreditSimulator />
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Comment ça marche</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {STEPS.map(([n, heading, desc]) => (
            <div key={n} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5">
              <span className="font-display text-3xl text-brand">{n}</span>
              <div>
                <div className="font-display text-lg font-medium text-ink">{heading}</div>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-slate-500">
          Exemple : vous dépensez 1 000 € sur l'année pour du ménage régulier. Vous reportez cette somme case 7DB
          de votre déclaration. Si vous êtes imposable, l'État déduit 500 € de votre impôt ; si vous ne l'êtes pas,
          il vous verse un chèque de 500 €.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">
          Catégories éligibles au crédit d'impôt
        </h2>
        <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
          {ELIGIBLE_CATEGORIES.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand-dark"
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-xl text-center text-xs text-slate-400">
          Liste des services Services 34 éligibles, telle que définie à l'article D7231-1 du Code du travail. La
          conciergerie et l'entretien de piscine n'en font pas partie.
        </p>
      </section>

      <section className="mx-auto mt-16 max-w-2xl">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">Questions fréquentes</h2>
        <div className="mt-8 space-y-3">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="group rounded-lg border border-slate-200 bg-white p-4">
              <summary className="cursor-pointer list-none font-display text-base font-medium text-ink marker:content-none">
                {q}
              </summary>
              <p className="mt-2 text-sm text-slate-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-16 mb-4 rounded-lg bg-ink py-10 px-6 text-center text-white md:px-12">
        <h2 className="font-display text-2xl font-semibold">Prêt à passer à l'action ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/80">
          Décrivez votre besoin en quelques minutes et profitez de votre crédit d'impôt dès votre première mission.
        </p>
        <div className="mt-6">
          <Link href="/demande" className="rounded-md bg-white px-6 py-3 font-medium text-ink hover:bg-slate-100">
            Demander une intervention
          </Link>
        </div>
      </section>
    </div>
  );
}
