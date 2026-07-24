import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Nettoyage de fin de bail à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Avant de rendre les clés, nos agents assurent un nettoyage complet du logement pour maximiser vos chances de récupérer votre dépôt de garantie.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/nettoyage-fin-de-bail` },
  openGraph: { title, description, url: `${SITE_URL}/menage/nettoyage-fin-de-bail`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function NettoyageFinDeBailPage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Nettoyage de fin de bail"
      intro="Avant de rendre les clés, un logement impeccable facilite la restitution du dépôt de garantie. Nos agents assurent un nettoyage complet, pièce par pièce."
      sections={[
        {
          heading: 'Un nettoyage complet, pensé pour la sortie',
          body: [
            "Ce nettoyage couvre l'ensemble du logement : sols, sanitaires, cuisine et électroménager, placards vidés, vitres. L'objectif est de rendre un logement dans un état comparable à celui de l'entrée, pour éviter toute retenue injustifiée sur le dépôt de garantie.",
          ],
        },
      ]}
      tips={[
        "Planifiez cette prestation après avoir vidé le logement de vos effets personnels.",
        "Précisez si l'électroménager (four, réfrigérateur) doit être inclus dans le nettoyage.",
      ]}
      faq={[
        { q: 'Ce nettoyage garantit-il la restitution du dépôt de garantie ?', a: "Non, la restitution dépend de l'état des lieux global, mais un logement propre limite fortement les retenues liées à la propreté." },
        { q: "Faut-il que le logement soit vide pour l'intervention ?", a: "C'est préférable pour un nettoyage complet, mais précisez votre situation dans la demande." },
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
