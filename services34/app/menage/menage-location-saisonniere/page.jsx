import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Ménage de location saisonnière à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Entre deux locations saisonnières, nos agents remettent votre logement impeccable, rapidement et avec les mêmes standards à chaque passage.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/menage-location-saisonniere` },
  openGraph: { title, description, url: `${SITE_URL}/menage/menage-location-saisonniere`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function MenageLocationSaisonnierePage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Ménage de location saisonnière"
      intro="Sur le littoral entre Agde, Vias et Marseillan, les locations saisonnières s'enchaînent souvent avec des délais serrés entre deux séjours. Nos agents assurent un ménage rapide et fiable, prêt pour l'arrivée des prochains locataires."
      sections={[
        {
          heading: 'Un standard constant à chaque changement de locataire',
          body: [
            "Le ménage entre deux locations doit être rapide sans sacrifier la qualité : literie, sanitaires, cuisine, sols. Nos agents s'organisent pour respecter les délais souvent courts entre le départ d'un locataire et l'arrivée du suivant, fréquents en haute saison.",
          ],
        },
      ]}
      tips={[
        "Précisez le créneau disponible entre le départ et la prochaine arrivée — cela nous aide à organiser l'intervention.",
        "Pour une gestion régulière tout au long de la saison, vous pouvez demander un agent attitré.",
      ]}
      faq={[
        { q: 'Pouvez-vous intervenir avec un délai très court entre deux locations ?', a: "Faites votre demande dès que possible en précisant le créneau disponible — nous ferons au mieux selon la disponibilité." },
        { q: 'Le linge de lit est-il changé ?', a: "Précisez ce besoin dans votre demande, cela peut être inclus selon votre organisation." },
      ]}
      related={[
        { label: '🧹 Retour à Ménage', href: '/menage' },
        { label: "Ménage d'état des lieux", href: '/menage/menage-etat-des-lieux' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
