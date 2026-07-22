import Link from 'next/link';
import { SITE_URL, SITE_NAME } from '../../lib/seo';
import TaxCreditSimulator from '../../components/TaxCreditSimulator';

const title = 'Crédit d\'impôt sur les services à domicile — Jobber';
const description =
  "50 % de vos dépenses en services à la personne sur Jobber vous sont remboursés par l'État sous forme de crédit d'impôt. Découvrez comment ça marche et simulez votre économie.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/credit-impot` },
  openGraph: { title, description, url: `${SITE_URL}/credit-impot`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

const STEPS = [
  ['1', 'Vous faites intervenir un jobber chez vous', 'Pour un service éligible : ménage, garde d\'enfants, jardinage, bricolage, aide à domicile, cours particuliers, informatique…'],
  ['2', 'Vous le payez et le déclarez', 'Le paiement passe par Jobber, qui gère la déclaration et le prélèvement des charges sociales à votre place.'],
  ['3', 'Vous reportez la dépense sur votre impôt', 'Le montant total de l\'année s\'inscrit dans la case 7DB de votre déclaration de revenus.'],
  ['4', "L'État vous rembourse 50 %", "Sous forme de crédit d'impôt : une déduction si vous êtes imposable, un chèque sinon."],
];

const ELIGIBLE_CATEGORIES = [
  ['Ménage', 'menage'],
  ['Bricolage (2 h ou moins)', 'bricolage'],
  ['Jardinage', 'jardinage'],
  ['Garde d\'enfants', 'garde-enfants'],
  ['Aide à domicile', 'aide-personne'],
  ['Cours particuliers', 'cours-particuliers'],
  ['Informatique', 'informatique'],
];

const FAQ = [
  {
    q: "Le crédit d'impôt, qu'est-ce que c'est exactement ?",
    a: "Dès qu'un particulier vous rend un service à domicile, même ponctuellement, vous devenez son employeur au sens fiscal. Pour encourager la déclaration de ces emplois plutôt que le travail non déclaré, l'État a mis en place un avantage fiscal qui vous rembourse la moitié de ce que vous avez dépensé en services à la personne au cours de l'année.",
  },
  {
    q: "Quelle différence entre crédit d'impôt et réduction d'impôt ?",
    a: "Une réduction d'impôt fait baisser ce que vous devez, mais ne vous rapporte rien si vous n'êtes pas imposable. Un crédit d'impôt, lui, vous est versé dans tous les cas : il diminue votre impôt si vous en payez, et l'administration vous envoie la différence par chèque ou virement si vous n'êtes pas imposable.",
  },
  {
    q: 'Qui peut en bénéficier ?',
    a: "Toute personne domiciliée fiscalement en France, quel que soit son statut — salarié, indépendant, retraité, non imposable. Ça vaut aussi pour une résidence secondaire en France, ou pour des services rendus chez vos parents.",
  },
  {
    q: "Quel est le plafond du crédit d'impôt ?",
    a: "Vous dépensez ce que vous voulez, mais le crédit d'impôt n'est calculé que sur 12 000 € de dépenses par an au maximum — soit 6 000 € remboursés au maximum. Ce plafond augmente de 1 500 € par enfant à charge ou par personne de plus de 65 ans dans le foyer, jusqu'à 15 000 €. Il grimpe même à 18 000 € la première année où vous déclarez, et à 20 000 € en cas de handicap reconnu (carte d'invalidité 80 %) dans le foyer.",
  },
  {
    q: "Puis-je bénéficier du crédit d'impôt pour des travaux de jardinage ou de bricolage ?",
    a: "Oui pour l'entretien courant — tonte, taille, petites réparations — dans la limite de 12 000 € par an pour le jardinage, et de 2 heures par intervention pour le bricolage (plafonné à 500 € par an). Les gros travaux nécessitant un artisan qualifié (dessouchage, création de jardin par un paysagiste, véranda…) ne sont en revanche pas éligibles.",
  },
  {
    q: 'Comment déclarer mes prestataires sur Jobber ?',
    a: "Depuis votre espace Jobber, rubrique « Déclaratif et crédit d'impôt », chaque mission payée sur une catégorie éligible peut être déclarée en un clic. Jobber prélève les charges sociales et transmet la déclaration à l'URSSAF pour vous — vous recevez ensuite votre attestation fiscale par email.",
  },
  {
    q: "Comment récupérer mon crédit d'impôt ?",
    a: "Téléchargez votre attestation fiscale annuelle depuis votre compte Jobber, reportez le montant total dans la case 7DB de votre déclaration de revenus, et c'est tout. Si vous y êtes éligible, le crédit d'impôt vous est versé à l'été, en même temps que votre avis d'imposition.",
  },
];

export default function CreditImpotPage() {
  return (
    <div>
      <section className="overflow-hidden rounded-lg border border-moss/20 bg-moss-light py-10 px-6 text-center md:px-12">
        <span className="rounded-full bg-moss px-3 py-1 text-xs font-bold uppercase tracking-wide text-paper">
          Crédit d'impôt
        </span>
        <h1 className="mx-auto mt-4 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          50 % de vos dépenses vous sont remboursées par l'État.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink">
          Les services à la personne réalisés sur Jobber ouvrent droit à un crédit d'impôt de 50 %. Simulez votre
          économie ci-dessous.
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
              <span className="font-display text-3xl text-moss">{n}</span>
              <div>
                <div className="font-display text-lg font-medium text-ink">{heading}</div>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-slate-500">
          Exemple : vous dépensez 6 000 € sur l'année pour une garde d'enfants. Vous reportez cette somme case 7DB
          de votre déclaration. Si vous êtes imposable, l'État déduit 3 000 € de votre impôt ; si vous ne l'êtes
          pas, il vous verse un chèque de 3 000 €.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-ink">
          Catégories éligibles au crédit d'impôt
        </h2>
        <div className="mx-auto mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
          {ELIGIBLE_CATEGORIES.map(([label, slug]) => (
            <Link
              key={slug}
              href={`/services/${slug}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-moss hover:text-moss-dark"
            >
              {label}
            </Link>
          ))}
        </div>
        <p className="mx-auto mt-4 max-w-xl text-center text-xs text-slate-400">
          Liste non exhaustive des services à la personne éligibles, telle que définie à l'article D7231-1 du Code
          du travail. L'aide aux personnes âgées ou handicapées (hors soins) et l'aide à la mobilité en font
          également partie.
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
        <h2 className="font-display text-2xl font-semibold">Publiez votre premier besoin</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/80">
          Déclarez vos prestataires en un clic et profitez de votre crédit d'impôt dès votre première mission.
        </p>
        <div className="mt-6">
          <Link href="/missions/new" className="rounded-md bg-white px-6 py-3 font-medium text-ink hover:bg-slate-100">
            Publier un besoin
          </Link>
        </div>
      </section>
    </div>
  );
}
