'use client';

import Link from 'next/link';
import { useState } from 'react';
import LogoMark, { SERVICES34_DARK_BLUE, SERVICES34_GOLD } from './Logo';
import { useBrand } from '../lib/brand-context';
import { useAuth } from '../lib/auth-context';

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
  const { user } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Pictogram left, wordmark right — same layout as Jobber's header. */}
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <LogoMark color={brand.prefix ? brand.color : SERVICES34_GOLD} className="h-10 w-10 shrink-0" />
          <span className="whitespace-nowrap font-brand text-base font-extrabold uppercase tracking-tight text-ink sm:text-lg">
            {/* Category prefix (e.g. "Conciergerie ") only shows once there's
                room for it — on narrow screens it can push "34" onto its own
                line and split the wordmark awkwardly. */}
            <span className="hidden sm:inline">{brand.prefix}</span>
            <span style={{ color: SERVICES34_DARK_BLUE }}>Services</span>{' '}
            <span style={{ color: brand.prefix ? brand.color : SERVICES34_GOLD }}>34</span>
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
          <Link href={user ? '/compte' : '/auth/login'} className="text-sm font-medium text-ink hover:text-brand">
            {user ? 'Mon compte' : 'Se connecter'}
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
            <Link href={user ? '/compte' : '/auth/login'} className="text-sm font-medium text-ink" onClick={() => setOpen(false)}>
              {user ? 'Mon compte' : 'Se connecter'}
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
