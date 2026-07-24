import PrestationDetailPage from '../../../components/PrestationDetailPage';
import BrandSetter from '../../../components/BrandSetter';
import { SITE_URL, SITE_NAME } from '../../../lib/seo';

const title = 'Débroussaillage à Béziers, Agde, Vias, Marseillan — Services 34';
const description = "Le débroussaillage est une obligation légale dans une grande partie de l'Hérault. Nos agents s'occupent du défrichage de votre terrain, en toute saison.";

export const metadata = {
  title,
  description,
  alternates: { canonical: `${SITE_URL}/jardinage/debroussaillage` },
  openGraph: { title, description, url: `${SITE_URL}/jardinage/debroussaillage`, siteName: SITE_NAME, locale: 'fr_FR', type: 'website' },
};

export default function DebroussaillagePage() {
  return (
    <>
    <BrandSetter category="jardinage" label="Jardinage" />
    <PrestationDetailPage
      category="jardinage"
      categoryLabel="Jardinage"
      categoryHref="/jardinage"
      eyebrow="Jardinage"
      title="Débroussaillage"
      intro="Un terrain propre, aéré, et conforme à la réglementation en vigueur dans l'Hérault : nos agents défrichent votre parcelle, quelle que soit la saison."
      sections={[
        {
          heading: "Une obligation légale sur une grande partie du département",
          body: [
            "Dans plusieurs zones de l'Hérault, comme dans d'autres départements exposés au risque d'incendie, le débroussaillement des terrains est une obligation légale. Elle vise à limiter la propagation du feu à proximité des habitations et des massifs boisés, et concerne aussi bien les propriétés isolées que celles situées en lisière de forêt.",
            "Au-delà de l'aspect réglementaire, un terrain débroussaillé régulièrement reste plus sain : moins de ronces envahissantes, une meilleure circulation de l'air, et un jardin plus facile à entretenir par la suite.",
          ],
        },
        {
          heading: 'Quelle est la meilleure période pour débroussailler ?',
          body: [
            "La réglementation impose généralement d'avoir débroussaillé avant le début de l'été. Dans les faits, l'automne et l'hiver restent les périodes les plus pratiques : la végétation est en dormance, les arbustes sont à nu, et l'intervention est à la fois plus rapide et moins agressive pour le reste du jardin.",
            "Quelle que soit la saison choisie, débroussailler favorise la biodiversité du terrain en donnant de l'espace aux plantations que vous souhaitez conserver.",
          ],
        },
      ]}
      steps={[
        { title: 'Repérage des végétaux à conserver', desc: "L'agent identifie avec vous les arbres et arbustes à préserver avant toute intervention, pour éviter de couper ce qui met des années à repousser." },
        { title: 'Élimination des arbustes et végétaux indésirables', desc: "Les arbustes morts, envahissants ou trop denses sont coupés, branche par branche, avant que le tronc ne soit retiré si nécessaire." },
        { title: 'Traitement des ronces', desc: "Les ronces demandent souvent plusieurs passages à quelques semaines d'intervalle pour être éliminées durablement." },
        { title: 'Nettoyage du sol', desc: "Mauvaises herbes et racines résiduelles sont retirées pour laisser un terrain net et prêt pour la suite de son entretien." },
      ]}
      tips={[
        "Les déchets verts peuvent être évacués en déchèterie par l'agent sur demande — précisez-le lors de votre demande d'intervention.",
        "Une partie des végétaux coupés peut être broyée sur place pour être valorisée en paillage ou en compost.",
        "Un terrain encombré de pierres ou de gravats doit être signalé à l'avance : cela évite d'endommager le matériel professionnel utilisé par l'agent.",
      ]}
      faq={[
        { q: 'Qui est responsable du débroussaillage sur mon terrain ?', a: "La réglementation fait peser cette obligation sur le propriétaire ou l'occupant du terrain concerné, qu'il soit habité ou non." },
        { q: 'Quel est le tarif pour un débroussaillage ?', a: "Le tarif dépend de la surface et de l'état du terrain. Décrivez votre besoin, un agent Services 34 vous propose un devis avant toute intervention." },
        { q: 'Que faire des ronces qui reviennent après un premier passage ?', a: "C'est fréquent : les ronces repoussent vite. Un second passage à quelques semaines d'intervalle est souvent nécessaire pour un résultat durable — vous pouvez le prévoir directement avec votre agent." },
      ]}
      related={[
        { label: '🌱 Retour à Jardinage', href: '/jardinage' },
        { label: 'Demander une intervention', href: '/demande' },
      ]}
    />
    </>
  );
}
