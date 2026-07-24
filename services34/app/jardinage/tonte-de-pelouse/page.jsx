import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Tonte de pelouse à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Pelouse tondue régulièrement ou remise en état après une longue absence : nos agents s'occupent de votre gazon toute l'année.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/tonte-de-pelouse` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/tonte-de-pelouse`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function TonteDePelousePage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Tonte de pelouse"
      intro="Passage ponctuel ou entretien régulier : nos agents tondent votre pelouse et évacuent l'herbe coupée si vous le souhaitez."
      sections={[
        {
          heading: 'Un entretien adapté au climat du littoral',
          body: [
            "Dans le climat méditerranéen de Béziers, Agde et Marseillan, la pelouse pousse vite au printemps et ralentit fortement l'été en cas de sécheresse. Nos agents adaptent la fréquence de passage à la saison pour un résultat régulier sans sur-tondre en période de forte chaleur.",
          ],
        },
        {
          heading: 'Pour les grandes surfaces comme pour les petits jardins',
          body: [
            "Que vous ayez un petit jardin de ville ou une grande parcelle, précisez la surface approximative dans votre demande. L'agent vient avec son propre matériel, adapté à la configuration de votre terrain.",
          ],
        },
      ]}
      tips={[
        "Indiquez si vous souhaitez un passage unique ou un entretien récurrent — cela peut être précisé directement dans votre demande.",
        "Si votre pelouse n'a pas été tondue depuis longtemps, signalez-le : une remise en état demande souvent plus de temps qu'une tonte classique.",
      ]}
      faq={[
        { q: "L'herbe coupée est-elle ramassée ?", a: "Oui, sur demande. Précisez si vous souhaitez que l'herbe soit évacuée ou laissée sur place en paillage." },
        { q: 'À quelle fréquence dois-je faire tondre ma pelouse ?', a: "Cela dépend de la saison — au printemps un passage toutes les deux semaines est courant, l'été le rythme peut ralentir en cas de sécheresse." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Taille de haie', href: '/jardinage/taille-de-haie' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
