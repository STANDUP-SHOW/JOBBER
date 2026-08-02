import Link from 'next/link';
import Image from 'next/image';
import { SERVICES34_DARK_BLUE } from './Logo';

const SERVICES = [
  ['Bricolage', '/bricolage'],
  ['Ménage', '/menage'],
  ['Jardinage', '/jardinage'],
  ['Piscine', '/piscine'],
  ['Conciergerie', '/conciergerie'],
];

const AREA_LOGOS = [
  ['/images/footer/beziers-mediterranee.webp', 'Agglomération Béziers Méditerranée'],
  ['/images/footer/vias.png', 'Vias Méditerranée'],
  ['/images/footer/marseillan.jpg', 'Marseillan'],
  ['/images/footer/agde.webp', 'Agde, Archipel de vie'],
  ['/images/footer/agglo-herault-mediterranee.png', "L'Agglo Hérault Méditerranée"],
];

const LABEL_LOGOS = [
  ['/images/footer/services-a-la-personne.png', 'Services à la personne'],
  ['/images/footer/charte-qualite.jpeg', 'Charte nationale qualité Services à la personne'],
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="font-display text-lg font-bold text-brand">Services 34</div>
            <p className="mt-2 text-sm text-slate-500">
              Services à la personne à Béziers, Agde, Vias, Marseillan et dans tout le pourtour biterrois.
            </p>
            <div className="mt-4 rounded-lg bg-[#f8a703] px-4 py-4" style={{ color: SERVICES34_DARK_BLUE }}>
              <div className="text-sm font-bold">Nous contacter</div>
              <div className="mt-3 space-y-2.5">
                <Link href="/contact" className="flex items-center gap-2 hover:opacity-80">
                  <span className="text-base leading-none">📝</span>
                  <span className="text-sm font-medium">Formulaire de contact</span>
                </Link>
                <Link href="/compte" className="flex items-center gap-2 hover:opacity-80">
                  <span className="text-base leading-none">💬</span>
                  <span className="text-sm font-medium">Messagerie du site</span>
                </Link>
                <a href="mailto:contact@service34.fr" className="flex items-center gap-2 hover:opacity-80">
                  <span className="text-base leading-none">✉️</span>
                  <span className="text-sm font-medium">contact@service34.fr</span>
                </a>
                <a href="tel:+33746476968" className="flex items-center gap-2 hover:opacity-80">
                  <span className="text-base leading-none">📞</span>
                  <span className="text-sm font-medium">07 46 47 69 68</span>
                </a>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Nos services</div>
            <ul className="mt-2 space-y-1.5">
              {SERVICES.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-slate-500 hover:text-brand">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Zone d'intervention</div>
            <p className="mt-2 text-sm text-slate-500">
              Béziers · Agde · Vias · Marseillan et les communes environnantes, dans un rayon de 50 km.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {AREA_LOGOS.map(([src, alt]) => (
                <div key={src} className="relative h-9 w-16">
                  <Image src={src} alt={alt} fill className="object-contain" sizes="64px" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {LABEL_LOGOS.map(([src, alt]) => (
                <div key={src} className="relative h-10 w-24">
                  <Image src={src} alt={alt} fill className="object-contain" sizes="96px" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} Services 34</p>
      </div>
    </footer>
  );
}
