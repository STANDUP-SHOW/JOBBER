import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Entretien de piscine à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Dans le cadre d'un entretien global du jardin, nos agents peuvent aussi assurer un entretien courant de votre piscine. Pour un suivi dédié, voir notre page Piscine.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/entretien-piscine` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/entretien-piscine`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function EntretienPiscineJardinagePage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Entretien de piscine"
      intro="Vous faites déjà appel à un agent pour votre jardin ? Il peut aussi assurer l'entretien courant de votre piscine dans la même intervention."
      sections={[
        {
          heading: "Un entretien combiné, pratique pour les propriétaires",
          body: [
            "Beaucoup de nos clients possèdent à la fois un jardin et une piscine, notamment sur le littoral entre Agde et Marseillan. Plutôt que de faire appel à deux prestataires différents, un même agent peut assurer l'entretien du jardin et le suivi courant de la piscine (nettoyage de surface, contrôle visuel, vidage du filtre) lors du même passage.",
          ],
        },
        {
          heading: "Pour un suivi plus complet, notre catégorie Piscine dédiée",
          body: [
            "Pour un entretien technique complet — équilibrage chimique de l'eau, traitement de l'eau verte, hivernage — nous vous recommandons notre catégorie Piscine, qui détaille l'ensemble de nos prestations spécialisées.",
          ],
        },
      ]}
      tips={[
        "Précisez si vous souhaitez combiner l'entretien du jardin et de la piscine dans la même demande.",
        "Pour un problème technique ou une eau trouble, consultez plutôt notre page Piscine dédiée.",
      ]}
      faq={[
        { q: "Le même agent peut-il s'occuper du jardin et de la piscine ?", a: "Dans de nombreux cas oui — précisez vos deux besoins dans la même demande." },
        { q: "Que couvre l'entretien courant proposé ici ?", a: "Le nettoyage de surface et un contrôle visuel simple. Pour un traitement chimique complet, consultez notre catégorie Piscine." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: '🏊 Voir la catégorie Piscine', href: '/piscine' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
