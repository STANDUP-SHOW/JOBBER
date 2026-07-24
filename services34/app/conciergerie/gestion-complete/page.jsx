import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Gestion complète de location saisonnière à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Confiez votre location saisonnière à Services 34 : jardinage, ménage entre chaque séjour, accueil des voyageurs, entretien de la piscine et gestion de votre annonce en ligne si vous le souhaitez.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/conciergerie/gestion-complete` },
  openGraph: { title, description, url: `${SITE_URL}/conciergerie/gestion-complete`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function GestionCompletePage() {
  return (
    <>
    <BrandSetter category="conciergerie" label="Conciergerie" />
    <PrestationDetailPage
      category="conciergerie"
      categoryLabel="Conciergerie"
      categoryHref="/conciergerie"
      eyebrow="Conciergerie"
      title="Gestion complète"
      intro="Votre logement est loué toute la saison ou toute l'année, mais vous n'avez ni le temps ni l'envie de tout gérer vous-même ? Avec la Gestion complète, un même agent Services 34 s'occupe de tout, du jardin jusqu'à l'accueil de vos voyageurs."
      sections={[
        {
          heading: "L'entretien du bien, entre chaque séjour",
          body: [
            "L'extérieur est entretenu régulièrement (tonte, taille, arrosage selon la saison) et l'intérieur reçoit un ménage complet entre chaque location, pour que chaque nouveau voyageur découvre un logement impeccable. Le linge de maison est également géré via notre service Buanderie-Pressing : draps, serviettes et linge de table sont collectés, lavés et remplacés à chaque rotation.",
          ],
        },
        {
          heading: "Un accueil et un départ pris en charge à chaque fois",
          body: [
            "À l'arrivée d'un locataire, l'agent remet les clés, réalise l'état des lieux d'entrée et présente le logement — mode de fonctionnement des équipements, consignes pratiques, réponses aux premières questions. Au départ, il récupère les clés, effectue l'état des lieux de sortie et lance le ménage de sortie pour préparer l'arrivée suivante.",
          ],
        },
        {
          heading: "La gestion de votre annonce, si vous le souhaitez",
          body: [
            "En option, Services 34 peut prendre en charge la mise en location complète : présence sur les plateformes de réservation, réponses aux messages des voyageurs, validation des réservations et organisation des rendez-vous. Vous n'avez plus qu'à profiter du résultat, sans avoir à répondre vous-même à chaque sollicitation.",
          ],
        },
        {
          heading: 'Une présence rassurante pendant toute la durée du séjour',
          body: [
            "Un agent reste disponible à proximité de votre bien pendant toute la durée de chaque location. En cas d'imprévu — un problème de piscine, une panne, une question du locataire — il peut intervenir en moins d'une heure. Vos voyageurs ne se retrouvent jamais démunis, et vous n'êtes jamais sollicité pour un souci mineur.",
          ],
        },
        {
          heading: "L'entretien de la piscine, sans y penser",
          body: [
            "Si votre bien dispose d'une piscine, elle est entretenue chaque semaine dans le cadre de la formule : contrôle du taux de chlore, brossage du bassin, passage du robot. Vous n'avez aucune démarche à effectuer, l'entretien fait partie intégrante du service.",
          ],
        },
        {
          heading: 'Une rémunération simple, sans avance de trésorerie de votre part',
          body: [
            "Les encaissements de vos locations restent directement sur votre compte : Services 34 ne perçoit jamais l'argent de vos voyageurs à votre place. Notre rémunération est un pourcentage prélevé sur le montant loué, dont le taux est fixé selon la complexité du bien (surface, présence d'une piscine ou d'un jardin, niveau de gestion souhaité). Ce taux vous est communiqué clairement avant toute signature.",
          ],
        },
      ]}
      tips={[
        "Décrivez votre bien le plus précisément possible dans votre demande (surface, nombre de chambres, présence d'une piscine ou d'un jardin) pour recevoir une proposition adaptée.",
        "Précisez si vous souhaitez confier la gestion de votre annonce en ligne, ou seulement l'entretien et l'accueil des voyageurs.",
        "Un contrat à la saison ou à l'année peut être établi selon votre mode de location.",
      ]}
      faq={[
        { q: "Services 34 encaisse-t-il l'argent de mes locations ?", a: "Non, les paiements de vos voyageurs restent sur votre compte personnel sur la plateforme de location. Notre rémunération est un pourcentage facturé séparément, jamais prélevé sur les paiements de vos clients." },
        { q: 'Puis-je choisir de garder la gestion de mon annonce et ne confier que l\'entretien ?', a: "Oui, la gestion intégrale de la plateforme (annonces, réponses, réservations) est une option — vous pouvez ne confier que l'entretien du bien et l'accueil des voyageurs si vous préférez garder la main sur votre annonce." },
        { q: "Que se passe-t-il si un locataire a un problème pendant son séjour ?", a: "Un agent reste disponible à proximité pendant toute la durée de la location et peut intervenir en moins d'une heure en cas de besoin." },
        { q: 'Quel est le montant de la commission ?', a: "Le taux est déterminé selon la complexité de votre bien (surface, équipements, niveau de service souhaité) et vous est communiqué clairement avant toute signature de contrat." },
      ]}
      related={[
        { label: '🔑 Retour à Conciergerie', href: '/conciergerie' },
        { label: 'Buanderie-Pressing', href: '/conciergerie/buanderie-pressing' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
