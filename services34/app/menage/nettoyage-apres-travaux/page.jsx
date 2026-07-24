import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Nettoyage après travaux à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Poussière de chantier, résidus de peinture, sols encombrés : nos agents nettoient en profondeur après vos travaux de rénovation.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/nettoyage-apres-travaux` },
  openGraph: { title, description, url: `${SITE_URL}/menage/nettoyage-apres-travaux`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function NettoyageApresTravauxPage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Nettoyage après travaux"
      intro="La poussière de chantier s'infiltre partout : nos agents nettoient en profondeur après vos travaux de rénovation, du sol au plafond."
      sections={[
        {
          heading: "Un nettoyage plus intense qu'un ménage classique",
          body: [
            "La poussière fine issue des travaux (perçage, ponçage, peinture) demande un nettoyage particulier : dépoussiérage des surfaces, sols, plinthes, interrupteurs, et parfois des grilles de ventilation. Nos agents viennent équipés pour ce type d'intervention plus intense qu'un ménage courant.",
          ],
        },
      ]}
      tips={[
        "Précisez la nature des travaux réalisés (peinture, perçage, démolition légère) pour un nettoyage adapté.",
        "Si des résidus de peinture ou de colle sont présents, signalez-le : cela peut nécessiter un traitement spécifique.",
      ]}
      faq={[
        { q: "Combien de temps après les travaux dois-je attendre pour ce nettoyage ?", a: "Vous pouvez planifier l'intervention dès la fin des travaux, une fois les gros déchets évacués." },
        { q: 'Évacuez-vous les gravats ou déchets de chantier ?', a: "Non, cette prestation concerne le nettoyage fin — les gros déchets doivent être évacués au préalable." },
      ]}
      related={[
        { label: '🧹 Retour à Ménage', href: '/menage' },
        { label: 'Ménage de printemps', href: '/menage/menage-de-printemps' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
