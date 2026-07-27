import Link from 'next/link';
import { SERVICES34_DARK_BLUE } from './Logo';

const SERVICES = [
  ['Bricolage', '/bricolage'],
  ['Ménage', '/menage'],
  ['Jardinage', '/jardinage'],
  ['Piscine', '/piscine'],
  ['Conciergerie', '/conciergerie'],
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
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">© {new Date().getFullYear()} Services 34</p>
      </div>
    </footer>
  );
}
