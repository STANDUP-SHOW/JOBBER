'use client';

import Link from 'next/link';
import { useState } from 'react';
import LogoMark from './Logo';
import { useBrand } from '../lib/brand-context';

const SERVICES = [
  ['Bricolage', '/bricolage'],
  ['Ménage', '/menage'],
  ['Jardinage', '/jardinage'],
  ['Piscine', '/piscine'],
  ['Conciergerie', '/conciergerie'],
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { brand } = useBrand();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Pictogram left, wordmark right — same layout as Jobber's header. */}
        <Link href="/" className="flex items-center gap-2">
          <LogoMark color={brand.color} className="h-10 w-10 shrink-0" />
          <span className="font-brand text-lg font-extrabold uppercase tracking-tight text-ink">
            {brand.prefix}<span style={{ color: brand.color }}>Services</span> 34
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {SERVICES.map(([label, href]) => (
            <Link key={href} href={href} className="text-sm font-medium text-ink hover:text-brand">
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login" className="text-sm font-medium text-ink hover:text-brand">
            Se connecter
          </Link>
          <Link href="/demande" className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            Demander une intervention
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md border border-slate-200 p-2 md:hidden"
          aria-label="Menu"
        >
          ☰
        </button>
      </div>

      {open && (
        <nav className="border-t border-slate-200 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {SERVICES.map(([label, href]) => (
              <Link key={href} href={href} className="text-sm font-medium text-ink" onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <Link href="/auth/login" className="text-sm font-medium text-ink" onClick={() => setOpen(false)}>
              Se connecter
            </Link>
            <Link
              href="/demande"
              className="mt-1 inline-block w-fit rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              Demander une intervention
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
