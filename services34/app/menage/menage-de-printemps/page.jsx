import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Ménage de printemps à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Un grand nettoyage en profondeur, une fois par an : nos agents s'occupent des recoins qu'un ménage courant ne couvre pas.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/menage-de-printemps` },
  openGraph: { title, description, url: `${SITE_URL}/menage/menage-de-printemps`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function MenageDePrintempsPage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Ménage de printemps"
      intro="Placards, plinthes, luminaires, derrière les meubles : le ménage de printemps couvre tout ce qu'un ménage courant ne traite pas au quotidien."
      sections={[
        {
          heading: 'Un nettoyage en profondeur, recoin par recoin',
          body: [
            "Ce ménage approfondi va au-delà de l'entretien courant : intérieur des placards, dépoussiérage des luminaires et plinthes, nettoyage derrière et sous les meubles accessibles, vitres intérieures. C'est l'occasion de repartir sur un logement entièrement propre.",
          ],
        },
      ]}
      tips={[
        "Signalez les zones auxquelles vous tenez particulièrement (four, intérieur des placards, vitres).",
        "Ce ménage prend plus de temps qu'un ménage courant — prévoyez une intervention plus longue.",
      ]}
      faq={[
        { q: 'En quoi cela diffère-t-il du ménage courant ?', a: "Le ménage de printemps couvre les zones profondes et les recoins qui ne sont pas traités lors d'un ménage courant hebdomadaire." },
        { q: 'À quelle fréquence faire ce ménage ?', a: "Une à deux fois par an est courant, mais vous pouvez le demander quand vous le souhaitez." },
      ]}
      related={[
        { label: '🧹 Retour à Ménage', href: '/menage' },
        { label: 'Nettoyage de vitres', href: '/menage/nettoyage-vitres' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
