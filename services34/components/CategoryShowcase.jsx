import Image from 'next/image';
import Link from 'next/link';
import LogoMark from './Logo';
import { CATEGORY_COLORS } from '../lib/categoryColors';

export default function CategoryShowcase({ category, label, image, pitch, href, reverse = false }) {
  const color = CATEGORY_COLORS[category];

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="grid md:grid-cols-2">
        <div className={`relative aspect-square ${reverse ? 'md:order-2' : ''}`}>
          <Image
            src={image}
            alt={`${label} Services 34`}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <div className="absolute left-5 top-5 flex items-center gap-2">
            <LogoMark color={color} className="h-9 w-9 drop-shadow" />
            <span className="font-brand text-lg font-extrabold uppercase tracking-tight drop-shadow-sm">
              <span style={{ color }}>{label}</span> <span className="text-ink">Services 34</span>
            </span>
          </div>
        </div>
        <div className={`flex flex-col justify-center p-8 md:p-10 ${reverse ? 'md:order-1' : ''}`}>
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color }}>{label} Services 34</span>
          <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-tight text-ink md:text-4xl">{label}</h2>
          <p className="mt-4 max-w-md text-slate-600">{pitch}</p>
          <Link
            href={href}
            className="mt-6 inline-block w-fit rounded-md px-6 py-3 font-medium text-white hover:opacity-90"
            style={{ backgroundColor: color }}
          >
            Découvrir {label}
          </Link>
        </div>
      </div>
    </section>
  );
}
