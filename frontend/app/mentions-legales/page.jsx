import { SITE_URL, SITE_NAME } from '../../lib/seo';

const title = 'Mentions légales — Jobber';
const description = "Informations légales concernant l'édition et l'hébergement du site Jobber.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/mentions-legales` },
  robots: { index: true, follow: true },
};

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-2xl pb-16">
      <span className="label-eyebrow text-moss">Informations légales</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Mentions légales</h1>

      <div className="prose-legal mt-8 space-y-8 text-slate-700">
        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Éditeur du site</h2>
          <p className="mt-2">
            Le site {SITE_URL.replace('https://', '')} (ci-après « le Site ») est édité par <strong>SERVICES 34</strong>,
            entreprise individuelle représentée par Monsieur Maxime Martinel, dont l'établissement est situé
            2 rue Julien Imbert, 34500 Béziers, France.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            SIRET : à compléter — N° TVA intracommunautaire : à compléter.
          </p>
          <p className="mt-2">
            Directeur de la publication : Maxime Martinel.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Hébergement</h2>
          <p className="mt-2">
            L'application (interface utilisateur) est hébergée par <strong>Vercel Inc.</strong>, 340 S Lemon Ave #4133,
            Walnut, CA 91789, États-Unis.
          </p>
          <p className="mt-2">
            Le serveur applicatif et la base de données sont hébergés par <strong>Railway Corporation</strong>,
            80 E Rio Salado Pkwy, Tempe, AZ 85281, États-Unis.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Responsabilité</h2>
          <p className="mt-2">
            SERVICES 34 met en œuvre les moyens raisonnables pour assurer l'accès et le bon fonctionnement du Site,
            sans pouvoir garantir une disponibilité continue et sans erreur.
          </p>
          <p className="mt-2">Les utilisateurs demeurent seuls responsables :</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>des informations qu'ils publient sur le Site,</li>
            <li>des prestations qu'ils proposent ou réservent,</li>
            <li>du respect de la réglementation applicable à leur activité.</li>
          </ul>
          <p className="mt-2">
            SERVICES 34 ne pourra être tenue responsable des dommages indirects résultant de l'utilisation du Site.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Droit applicable</h2>
          <p className="mt-2">
            Les présentes mentions légales sont régies par le droit français. En cas de litige, et à défaut de
            résolution amiable, les tribunaux compétents seront ceux du ressort du siège de SERVICES 34, sauf
            disposition légale impérative contraire applicable aux consommateurs.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-ink">Contact et signalement</h2>
          <p className="mt-2">
            Pour toute question ou signalement d'un contenu illicite, vous pouvez contacter SERVICES 34 à l'adresse
            suivante : <a href="mailto:contact@jobber.city" className="text-moss hover:underline">contact@jobber.city</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
