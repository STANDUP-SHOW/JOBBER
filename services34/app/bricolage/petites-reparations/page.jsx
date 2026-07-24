import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Petites réparations diverses à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Une liste de petites réparations qui traînent depuis des mois : nos agents s'en occupent en une seule intervention.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/bricolage/petites-reparations` },
  openGraph: { title, description, url: `${SITE_URL}/bricolage/petites-reparations`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function PetitesReparationsPage() {
  return (
    <>
    <BrandSetter category="bricolage" label="Bricolage" />
    <PrestationDetailPage
      category="bricolage"
      categoryLabel="Bricolage"
      categoryHref="/bricolage"
      eyebrow="Bricolage"
      title="Petites réparations diverses"
      intro="Une poignée de placard qui se dévisse, un joint de fenêtre à refaire, une charnière qui grince : nos agents regroupent vos petites réparations en une seule intervention."
      sections={[
        {
          heading: "La solution pour la liste de petites choses à faire",
          body: [
            "Chaque foyer a sa liste de petites réparations qui s'accumulent sans jamais devenir prioritaires. Plutôt que de faire appel à un professionnel différent pour chaque tâche, un seul agent peut regrouper plusieurs petites interventions en une visite : cela vous fait gagner du temps et souvent de l'argent.",
          ],
        },
      ]}
      tips={[
        "Listez toutes les petites réparations souhaitées dans votre demande : l'agent pourra les regrouper en une seule intervention.",
        "N'hésitez pas à ajouter des photos si l'un des problèmes est difficile à décrire par écrit.",
      ]}
      faq={[
        { q: 'Puis-je demander plusieurs réparations différentes en une seule fois ?', a: "Oui, c'est justement l'intérêt de cette prestation : listez tout ce dont vous avez besoin dans une seule demande." },
        { q: 'Que faire si la réparation dépasse le cadre du petit bricolage ?', a: "L'agent vous le signalera sur place et pourra vous orienter vers une intervention plus adaptée si nécessaire." },
      ]}
      related={[
        { label: '🔧 Retour à Bricolage', href: '/bricolage' },
        { label: 'Fixation d\'étagères', href: '/bricolage/fixation-etageres' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
