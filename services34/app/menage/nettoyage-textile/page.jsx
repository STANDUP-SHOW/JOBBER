import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Nettoyage textile (canapé, tapis, matelas) à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Canapé taché, tapis terni, matelas à rafraîchir : nos agents nettoient vos textiles en profondeur, par injection-extraction.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/menage/nettoyage-textile` },
  openGraph: { title, description, url: `${SITE_URL}/menage/nettoyage-textile`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function NettoyageTextilePage() {
  return (
    <>
    <BrandSetter category="menage" label="Ménage" />
    <PrestationDetailPage
      category="menage"
      categoryLabel="Ménage"
      categoryHref="/menage"
      eyebrow="Ménage"
      title="Nettoyage textile (canapé, tapis, matelas)"
      intro="Taches, odeurs, poussière accumulée : nos agents nettoient vos canapés, tapis et matelas en profondeur, sans avoir à les déplacer."
      sections={[
        {
          heading: 'Une méthode adaptée à chaque textile',
          body: [
            "Selon la matière (tissu, cuir, velours) et le type de tache, la méthode de nettoyage varie. Nos agents utilisent des techniques de nettoyage en profondeur, comme l'injection-extraction, pour redonner de l'éclat à vos textiles directement chez vous.",
          ],
        },
      ]}
      tips={[
        "Précisez le type de textile (canapé, tapis, matelas) et la matière si vous la connaissez.",
        "Un temps de séchage est nécessaire après l'intervention — évitez d'utiliser le textile pendant quelques heures.",
      ]}
      faq={[
        { q: 'Le nettoyage fonctionne-t-il sur toutes les taches ?', a: "La plupart des taches courantes s'améliorent nettement, mais certaines taches anciennes ou spécifiques peuvent ne pas disparaître complètement." },
        { q: 'Combien de temps faut-il pour que le textile sèche ?', a: "Cela dépend du textile et des conditions ambiantes — l'agent vous donnera une indication après l'intervention." },
      ]}
      related={[
        { label: '🧹 Retour à Ménage', href: '/menage' },
        { label: 'Ménage à domicile', href: '/menage/menage-a-domicile' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
