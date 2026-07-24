import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Surveillance de résidence secondaire à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Vous n'êtes pas toujours sur place : nos agents effectuent des passages réguliers pour vérifier que tout est en ordre dans votre résidence secondaire.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie/surveillance-residence-secondaire` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie/surveillance-residence-secondaire`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function SurveillanceResidenceSecondairePage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <PrestationDetailPage
      category="conciergerie"
      categoryLabel="Conciergerie"
      categoryHref="/conciergerie"
      eyebrow="Conciergerie"
      title="Surveillance de résidence secondaire"
      intro="Entre deux séjours, votre résidence secondaire reste vide pendant des semaines, parfois des mois. Nos agents effectuent des passages réguliers pour vérifier que tout est en ordre."
      sections={[
        {
          heading: 'Un passage de contrôle, pour votre tranquillité',
          body: [
            "Lors de chaque passage, l'agent vérifie l'état général du logement : absence de dégât des eaux, de tentative d'effraction, bon fonctionnement des installations. Un compte-rendu vous est transmis après chaque visite, avec photos si nécessaire.",
          ],
        },
        {
          heading: "Une prestation particulièrement utile sur le littoral",
          body: [
            "Entre Agde, Vias et Marseillan, de nombreux propriétaires ne résident dans leur bien que quelques semaines par an. Une surveillance régulière permet de détecter rapidement un problème (fuite, intrusion, dégât dû aux intempéries) avant qu'il ne s'aggrave.",
          ],
        },
      ]}
      tips={[
        "Précisez la fréquence de passage souhaitée : hebdomadaire, mensuelle ou selon votre calendrier de présence.",
        "Vous pouvez combiner la surveillance avec une aération régulière du logement.",
      ]}
      faq={[
        { q: 'Comment l\'agent accède-t-il au logement ?', a: "Les modalités d'accès (clés, code, boîte à clés) sont à convenir directement avec l'agent lors de la validation de la mission." },
        { q: 'Recevrai-je un compte-rendu après chaque passage ?', a: "Oui, un compte-rendu vous est transmis après chaque visite." },
      ]}
      related={[
        { label: '🔑 Retour à Conciergerie', href: '/conciergerie' },
        { label: 'Aération et entretien entre deux séjours', href: '/conciergerie/aeration-entretien-entre-sejours' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
