import Link from 'next/link';

const SERVICES = [
  ['🔧', 'Bricolage', '/bricolage', 'Montage de meubles, fixations, petites réparations.'],
  ['🧹', 'Ménage', '/menage', 'Ménage ponctuel ou régulier, vitres, repassage.'],
  ['🌱', 'Jardinage', '/jardinage', 'Tonte, taille de haie, entretien des espaces verts.'],
  ['🏊', 'Piscine', '/piscine', "Entretien régulier, remise en état, traitement de l'eau."],
  ['🔑', 'Conciergerie', '/conciergerie', 'Surveillance de résidence, accueil de locataires, clés.'],
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

      <section className="mt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map(([icon, title, href, desc]) => (
            <Link key={href} href={href} className="rounded-lg border border-slate-200 bg-white p-5 hover:border-brand hover:shadow-md">
              <span className="text-3xl">{icon}</span>
              <div className="mt-2 font-display text-lg font-semibold text-ink">{title}</div>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-lg border border-slate-200 bg-white p-6 text-center md:p-10">
        <h2 className="font-display text-2xl font-semibold text-ink">Pourquoi Services 34</h2>
        <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-left sm:grid-cols-2">
          {[
            ['🪪', 'Des agents identifiés et de confiance'],
            ['📋', 'Un tarif validé avant chaque intervention'],
            ['📍', 'Un service 100 % local, Béziers et ses environs'],
            ['💬', 'Un suivi de votre demande de bout en bout'],
          ].map(([icon, label]) => (
            <div key={label} className="flex items-center gap-3 rounded-lg bg-paper p-4">
              <span className="text-2xl">{icon}</span>
              <span className="font-medium text-ink">{label}</span>
            </div>
          ))}
        </div>
      </section>

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
    </div>
  );
}
