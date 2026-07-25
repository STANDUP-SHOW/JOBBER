import Link from 'next/link';
import Image from 'next/image';
import CategoryShowcase from '../components/CategoryShowcase';
import GuaranteesGrid from '../components/GuaranteesGrid';

const CATEGORIES = [
  {
    category: 'bricolage',
    label: 'Bricolage',
    image: '/images/categories/bricolage.png',
    href: '/bricolage',
    pitch: "Un tableau à accrocher, un meuble à monter, une prise à réparer : nos agents bricoleurs s'occupent des petits travaux du quotidien, avec leur propre outillage. Pour les particuliers comme pour les résidences secondaires du littoral, un devis clair avant chaque intervention.",
    guarantees: [
      { icon: '🧰', title: 'Des agents équipés', desc: "Nos agents se déplacent avec leur propre outillage professionnel — vous n'avez rien à fournir." },
      { icon: '📋', title: 'Un devis avant intervention', desc: "Le tarif est validé avant le début des travaux, sans mauvaise surprise sur la facture." },
      { icon: '🪪', title: 'Des agents de confiance', desc: "Chaque agent Services 34 est identifié et intervient au nom de l'entreprise." },
      { icon: '📍', title: 'Un service local', desc: "Nous intervenons exclusivement à Béziers, Agde, Vias, Marseillan et alentours." },
    ],
  },
  {
    category: 'jardinage',
    label: 'Jardinage',
    image: '/images/categories/jardinage.png',
    href: '/jardinage',
    pitch: "Tonte, taille de haie, débroussaillage obligatoire en zone à risque incendie : nos agents jardiniers entretiennent votre extérieur toute l'année, ponctuellement ou à chaque saison. Idéal aussi pour les propriétés que vous n'occupez qu'une partie de l'année.",
    guarantees: [
      { icon: '🌱', title: 'Entretien complet', desc: "De la simple tonte à l'entretien saisonnier complet, nos agents s'adaptent à la taille de votre extérieur." },
      { icon: '🧰', title: 'Matériel professionnel', desc: "Nos agents interviennent avec leur propre matériel (tondeuse, taille-haie, débroussailleuse…)." },
      { icon: '🪪', title: 'Des agents de confiance', desc: "Chaque agent Services 34 est identifié et intervient au nom de l'entreprise." },
      { icon: '📍', title: 'Un service local', desc: "Nous intervenons exclusivement à Béziers, Agde, Vias, Marseillan et alentours." },
    ],
  },
  {
    category: 'menage',
    label: 'Ménage',
    image: '/images/categories/menage.png',
    href: '/menage',
    pitch: "Ménage courant, grand nettoyage de printemps, remise en état entre deux locations saisonnières : nos agents s'adaptent à votre rythme et à vos produits, avec la même exigence à chaque passage.",
    guarantees: [
      { icon: '🔁', title: 'Ponctuel ou régulier', desc: "Un grand ménage avant un événement ou un passage chaque semaine, à vous de choisir la fréquence." },
      { icon: '🧴', title: 'Vos produits ou les nôtres', desc: "Précisez si vous préférez que l'agent utilise vos produits d'entretien ou apporte les siens." },
      { icon: '🪪', title: 'Des agents de confiance', desc: "Chaque agent Services 34 est identifié et intervient au nom de l'entreprise." },
      { icon: '📍', title: 'Un service local', desc: "Nous intervenons exclusivement à Béziers, Agde, Vias, Marseillan et alentours." },
    ],
  },
  {
    category: 'piscine',
    label: 'Piscine',
    image: '/images/categories/piscine.png',
    href: '/piscine',
    pitch: "Une eau claire toute la saison, sans y penser : nos agents contrôlent le taux de chlore, nettoient le bassin et surveillent les équipements, même quand vous n'êtes pas sur place.",
    guarantees: [
      { icon: '🏊', title: 'Entretien régulier', desc: "Passage hebdomadaire ou selon vos besoins : nettoyage du bassin, contrôle et équilibrage de l'eau." },
      { icon: '🔧', title: 'Remise en état', desc: "Après l'hiver ou une période sans entretien, nos agents remettent votre bassin en service." },
      { icon: '🪪', title: 'Des agents de confiance', desc: "Chaque agent Services 34 est identifié et intervient au nom de l'entreprise." },
      { icon: '📍', title: 'Un service local', desc: "Idéal pour les résidences secondaires du littoral, même en votre absence." },
    ],
  },
  {
    category: 'conciergerie',
    label: 'Conciergerie',
    image: '/images/categories/conciergerie.png',
    href: '/conciergerie',
    pitch: "Résidence secondaire ou location saisonnière sur le littoral : nos agents accueillent vos voyageurs, gèrent les clés et veillent sur votre bien en votre absence, jusqu'à la gestion complète clé en main.",
    guarantees: [
      { icon: '🏡', title: 'Gestion complète clé en main', desc: "Jardin, ménage, linge, accueil des voyageurs et entretien de la piscine : une seule formule pour ne plus rien gérer vous-même." },
      { icon: '🔑', title: 'Gestion des clés', desc: "Remise et récupération des clés, ouverture pour un artisan ou un livreur en votre absence." },
      { icon: '🏠', title: 'Surveillance régulière', desc: "Passages réguliers dans votre résidence secondaire pour vérifier que tout est en ordre." },
      { icon: '🧳', title: 'Accueil des voyageurs', desc: "Pour vos locations saisonnières : accueil, état des lieux d'entrée et de sortie." },
    ],
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="py-10 text-center">
        <span className="label-eyebrow text-brand">Béziers · Agde · Vias · Marseillan</span>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-bold leading-[1.1] text-ink md:text-5xl">
          Des agents de confiance pour tous vos services à domicile.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
          Bricolage, ménage, jardinage, piscine, conciergerie : décrivez votre besoin, un agent Services 34
          intervient chez vous, dans le pourtour biterrois.
        </p>
        <div className="mt-7">
          <Link href="/demande" className="rounded-md bg-brand px-6 py-3 font-medium text-white hover:bg-brand-dark">
            Demander une intervention
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-lg bg-clay px-6 py-6 text-center text-white md:px-10">
        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-clay">
          Nouveau
        </span>
        <div className="mt-2 font-display text-xl font-bold">Intervention en urgence</div>
        <p className="mx-auto mt-3 max-w-xl font-display text-3xl font-extrabold leading-tight md:text-4xl">
          Une urgence à la maison ? On s'en occupe tout de suite ! Et si on venait chez vous aujourd'hui ?
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-white">
          Cochez le bouton "Urgent" dans votre demande d'intervention.
        </p>
        <Link href="/urgence" className="mt-4 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-clay hover:bg-white/90">
          En savoir plus
        </Link>
      </section>

      <section className="mt-6 flex flex-col items-center gap-4 rounded-lg border-2 border-brand bg-brand-light px-6 py-6 text-center md:flex-row md:justify-between md:text-left">
        <div>
          <div className="font-display text-xl font-bold text-ink">Crédit d'impôt !</div>
          <p className="mt-1 text-sm text-ink">
            50 % du ménage, du jardinage et du petit bricolage réalisés avec Services 34 sont remboursés par l'État.
          </p>
        </div>
        <Link href="/credit-impot" className="shrink-0 rounded-md bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark">
          En savoir plus
        </Link>
      </section>

      <div className="mt-10 space-y-10">
        {CATEGORIES.map((c, i) => (
          <div key={c.category} className="space-y-4">
            <CategoryShowcase
              category={c.category}
              label={c.label}
              image={c.image}
              pitch={c.pitch}
              href={c.href}
              reverse={i % 2 === 1}
            />
            <GuaranteesGrid items={c.guarantees} />
          </div>
        ))}
      </div>

      <section className="mt-16 mb-4 rounded-lg bg-ink py-10 px-6 text-center text-white md:px-12">
        <h2 className="font-display text-2xl font-semibold">Prêt à passer à l'action ?</h2>
        <p className="mx-auto mt-2 max-w-xl text-white/80">
          Créez votre compte et décrivez votre besoin en quelques minutes.
        </p>
        <div className="mt-6">
          <Link href="/demande" className="rounded-md bg-white px-6 py-3 font-medium text-ink hover:bg-slate-100">
            Demander une intervention
          </Link>
        </div>
      </section>

      <section className="mt-10 mb-4 overflow-hidden rounded-lg border border-accent/30 bg-accent-light">
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-square md:aspect-auto">
            <Image
              src="/images/info/dechetterie.png"
              alt="Agent Services 34 chargeant des déchets verts dans son véhicule professionnel"
              fill
              className="object-cover"
              sizes="(min-width: 768px) 50vw, 100vw"
            />
          </div>
          <div className="p-6 md:p-10">
            <h2 className="font-display text-xl font-semibold text-ink">
              Déchetterie, recyclage, gravats et encombrants
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              Ce qui est peu connu : les déchèteries municipales sont financées par la taxe d'enlèvement des
              ordures ménagères, payée par les particuliers — pas par les professionnels. Un agent Services 34 qui
              dépose des déchets liés à une prestation doit donc s'acquitter d'une redevance spéciale, avec un pass
              professionnel dédié. Et oui, cela vaut aussi pour les déchets verts.
            </p>
            <p className="mt-3 text-sm text-slate-700">
              Ce coût recouvre plusieurs éléments pour l'agent : le temps du trajet jusqu'à la déchèterie, son
              carburant, l'usage de son véhicule professionnel, et une facturation au poids ou au volume selon le
              type de déchet — souvent plusieurs dizaines d'euros la tonne, avec des tarifs qui varient d'une
              commune à l'autre.
            </p>
            <p className="mt-3 text-sm font-medium text-ink">
              Des frais de déchetterie peuvent être introduits à votre devis : ce n'est pas une majoration
              arbitraire, c'est un coût réel que nous devons couvrir pour évacuer vos déchets dans les règles.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
