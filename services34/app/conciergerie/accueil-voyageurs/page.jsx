import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Accueil des voyageurs à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Pour vos locations saisonnières, nos agents accueillent vos voyageurs, leur remettent les clés et présentent le logement.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie/accueil-voyageurs` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie/accueil-voyageurs`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function AccueilVoyageursPage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <PrestationDetailPage
      category="conciergerie"
      categoryLabel="Conciergerie"
      categoryHref="/conciergerie"
      eyebrow="Conciergerie"
      title="Accueil des voyageurs"
      intro="Vous louez votre bien à des voyageurs mais ne pouvez pas être présent à chaque arrivée ? Nos agents assurent l'accueil, la remise des clés et la présentation du logement."
      sections={[
        {
          heading: "Un accueil qui compte pour l'expérience du voyageur",
          body: [
            "Un bon accueil influence directement la satisfaction de vos locataires et vos avis en ligne. Nos agents accueillent vos voyageurs à l'heure convenue, leur présentent le logement et ses équipements, et répondent à leurs premières questions pratiques.",
          ],
        },
        {
          heading: 'Adapté aux flux touristiques du littoral',
          body: [
            "Agde, Vias et Marseillan connaissent une forte activité de location saisonnière en été, avec des arrivées et départs qui s'enchaînent. Nos agents s'organisent pour couvrir ces créneaux, y compris en horaires décalés selon les besoins.",
          ],
        },
      ]}
      tips={[
        "Communiquez les horaires d'arrivée prévus dès que possible pour organiser l'accueil.",
        "Vous pouvez combiner cette prestation avec un ménage entre deux locations.",
      ]}
      faq={[
        { q: "L'agent peut-il accueillir en soirée ou tôt le matin ?", a: "Oui, précisez le créneau prévu — nous nous organisons selon la disponibilité des agents." },
        { q: 'Puis-je combiner accueil et ménage entre deux locations ?', a: "Oui, c'est une combinaison très fréquente en haute saison." },
      ]}
      related={[
        { label: '🔑 Retour à Conciergerie', href: '/conciergerie' },
        { label: "État des lieux d'entrée et de sortie", href: '/conciergerie/etat-des-lieux-entree-sortie' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
