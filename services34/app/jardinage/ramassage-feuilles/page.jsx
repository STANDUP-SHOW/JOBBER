import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Ramassage de feuilles à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Pelouse et allées recouvertes de feuilles mortes : nos agents ramassent et évacuent, ponctuellement ou tout au long de l'automne.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/ramassage-feuilles` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/ramassage-feuilles`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function RamassageFeuillesPage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Ramassage de feuilles"
      intro="Une pelouse recouverte de feuilles mortes s'abîme si elle n'est pas dégagée régulièrement. Nos agents ramassent et évacuent, en une intervention ponctuelle ou en passages réguliers pendant l'automne."
      sections={[
        {
          heading: 'Un entretien qui protège la pelouse',
          body: [
            "Laissées trop longtemps, les feuilles mortes étouffent le gazon et favorisent l'humidité stagnante. Un ramassage régulier pendant la période automnale évite ce problème et garde votre jardin propre en toute saison.",
          ],
        },
      ]}
      tips={[
        "Pendant la forte chute des feuilles, un passage régulier est plus efficace qu'une seule intervention en fin de saison.",
        "Précisez si vous souhaitez que les feuilles soient évacuées ou utilisées en paillage sur place.",
      ]}
      faq={[
        { q: 'Proposez-vous un passage régulier pendant l\'automne ?', a: "Oui, c'est une demande fréquente — vous pouvez planifier des passages réguliers avec le même agent." },
        { q: 'Les feuilles sont-elles évacuées ?', a: "Oui, sur demande. Elles peuvent aussi être laissées en paillage si vous le préférez." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Tonte de pelouse', href: '/jardinage/tonte-de-pelouse' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
