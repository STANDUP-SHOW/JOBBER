import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Remise en état de piscine à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Après l'hiver ou une période sans entretien, nos agents remettent votre bassin en service : nettoyage complet, équipements, équilibrage de l'eau.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/piscine/remise-en-etat` },
  openGraph: { title, description, url: `${SITE_URL}/piscine/remise-en-etat`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function RemiseEnEtatPage() {
  return (
    <>
    <BrandSetter category="piscine" label="Piscine" />
    <PrestationDetailPage
      category="piscine"
      categoryLabel="Piscine"
      categoryHref="/piscine"
      eyebrow="Piscine"
      title="Remise en état de la piscine"
      intro="Après l'hiver ou une longue période sans entretien, une piscine demande une remise en service complète avant de pouvoir en profiter. Nos agents s'occupent de chaque étape."
      sections={[
        {
          heading: "Une remise en service en plusieurs étapes",
          body: [
            "La remise en état comprend le nettoyage complet du bassin (parois, fond, ligne d'eau), le contrôle des équipements techniques (filtration, skimmers, robot), puis le rééquilibrage chimique complet de l'eau. C'est une étape indispensable avant l'ouverture de la saison, particulièrement après un hivernage.",
          ],
        },
      ]}
      tips={[
        "Prévoyez cette prestation quelques semaines avant l'ouverture prévue de la saison.",
        "Si l'eau est très verte ou trouble, signalez-le : cela peut nécessiter un traitement de choc avant le rééquilibrage classique.",
      ]}
      faq={[
        { q: 'Combien de temps faut-il pour une remise en état complète ?', a: "Cela dépend de l'état du bassin — l'agent vous donnera une estimation après avoir constaté la situation." },
        { q: "L'eau est très verte, pouvez-vous intervenir ?", a: "Oui, c'est une situation fréquente en sortie d'hiver — nos agents traitent l'eau verte dans le cadre de la remise en état." },
      ]}
      related={[
        { label: '🏊 Retour à Piscine', href: '/piscine' },
        { label: 'Traitement et hivernage', href: '/piscine/traitement-hivernage' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
