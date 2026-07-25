'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../lib/agency-auth-context';
import LogoMark from '../Logo';

const NAV = [
  { href: '/admin', label: 'Demandes d\'interventions reçues' },
  { href: '/admin/demandes-jobber', label: "Demandes d'intervention Jobber" },
  { href: '/admin/offres-jobber', label: 'Offres Jobber' },
  { href: '/admin/missions-jobber-en-cours', label: 'Missions Jobber en cours' },
  { href: '/admin/missions-jobber-terminees', label: 'Missions Jobber terminées' },
  { href: '/admin/factures-jobber', label: 'Mes factures Jobber' },
  { href: '/admin/missions-agence-en-cours', label: 'Missions Agence en cours' },
  { href: '/admin/missions-agence-terminees', label: 'Missions Agence terminées' },
  { href: '/admin/factures-agence', label: 'Mes factures Agence' },
  { href: '/admin/employes', label: 'Mes employés' },
  { href: '/admin/parametres', label: 'Paramètres du compte' },
];

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { agency, loading, logout } = useAgencyAuth();
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!loading && !agency && !isLoginPage) router.replace('/admin/login');
  }, [loading, agency, isLoginPage, router]);

  if (isLoginPage) {
    return <div className="min-h-screen bg-paper">{children}</div>;
  }

  if (loading || !agency) {
    return <div className="flex min-h-screen items-center justify-center bg-paper text-slate-400">Chargement…</div>;
  }

  return (
    <div className="min-h-screen bg-paper md:flex">
      <aside className="border-b border-slate-200 bg-white p-5 md:w-72 md:shrink-0 md:border-b-0 md:border-r">
        <Link href="/admin" className="flex items-center gap-2">
          <LogoMark color="#123E7A" className="h-9 w-9" />
          <span className="font-brand text-base font-extrabold uppercase tracking-tight text-ink">
            Services <span className="text-brand">34</span> <span className="text-xs font-medium normal-case text-slate-400">Admin</span>
          </span>
        </Link>
        <p className="mt-3 text-xs text-slate-400">{agency.companyName} · zone {agency.serviceRadiusKm} km</p>
        <nav className="mt-6 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname === item.href ? 'bg-brand text-white' : 'text-ink hover:bg-brand-light'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => { logout(); router.replace('/admin/login'); }}
          className="mt-6 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500 hover:border-slate-300"
        >
          Se déconnecter
        </button>
      </aside>
      <main className="flex-1 p-6 md:p-10">{children}</main>
    </div>
  );
}
