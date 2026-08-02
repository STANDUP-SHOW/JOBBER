'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAgencyAuth } from '../../lib/agency-auth-context';
import { agencyApi } from '../../lib/agencyApi';
import LogoMark, { SERVICES34_DARK_BLUE, SERVICES34_GOLD } from '../Logo';

const NAV = [
  { href: '/admin', label: 'Demandes d\'interventions reçues', section: 'demandes-recues' },
  { href: '/admin/nouvelle-mission-agence', label: 'Nouvelle mission agence' },
  { href: '/admin/demandes-jobber', label: "Demandes d'intervention Jobber", section: 'demandes-jobber' },
  { href: '/admin/offres-jobber', label: 'Offres Jobber', section: 'offres-jobber' },
  { href: '/admin/offre-acceptee', label: 'Offre acceptée par le client', section: 'offre-acceptee' },
  { href: '/admin/missions-jobber-en-cours', label: 'Missions Jobber en cours', section: 'missions-jobber-en-cours' },
  { href: '/admin/missions-jobber-terminees', label: 'Missions Jobber terminées', section: 'missions-jobber-terminees' },
  { href: '/admin/factures-jobber', label: 'Mes factures Jobber' },
  { href: '/admin/missions-agence-propositions', label: 'Propositions en attente', section: 'missions-agence-propositions' },
  { href: '/admin/missions-agence-en-cours', label: 'Missions Agence en cours', section: 'missions-agence-en-cours' },
  { href: '/admin/missions-agence-terminees', label: 'Missions Agence terminées', section: 'missions-agence-terminees' },
  { href: '/admin/factures-agence', label: 'Mes factures Agence' },
  { href: '/admin/planning', label: 'Planning' },
  { href: '/admin/employes', label: 'Mes employés OFF' },
  { href: '/admin/employes-actifs', label: 'Mes employés ON' },
  { href: '/admin/clients', label: 'Membres inscrits', section: 'clients' },
  { href: '/admin/contact-messages', label: 'Messages', section: 'contact-messages' },
  { href: '/admin/parametres', label: 'Paramètres du compte' },
];

const POLL_MS = 30000;

function Badge({ count }) {
  if (!count) return null;
  return (
    <span className="ml-1.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { agency, token, loading, logout } = useAgencyAuth();
  const isLoginPage = pathname === '/admin/login';
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (!loading && !agency && !isLoginPage) router.replace('/admin/login');
  }, [loading, agency, isLoginPage, router]);

  useEffect(() => {
    if (!token || !agency) return;
    let cancelled = false;
    function refresh() {
      agencyApi.notificationCounts(token).then(({ counts }) => { if (!cancelled) setCounts(counts); }).catch(() => {});
    }
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [token, agency]);

  useEffect(() => {
    if (!token) return;
    const item = NAV.find((n) => (n.href === '/admin' ? pathname === n.href : pathname.startsWith(n.href)));
    if (item?.section) {
      agencyApi.markSectionSeen(item.section, token).then(() => {
        setCounts((c) => ({ ...c, [item.section]: 0 }));
      }).catch(() => {});
    }
  }, [pathname, token]);

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
          <LogoMark color={SERVICES34_GOLD} className="h-9 w-9" />
          <span className="font-brand text-base font-extrabold uppercase tracking-tight text-ink">
            <span style={{ color: SERVICES34_DARK_BLUE }}>Services</span> <span style={{ color: SERVICES34_GOLD }}>34</span>{' '}
            <span className="text-xs font-medium normal-case text-slate-400">Admin</span>
          </span>
        </Link>
        <p className="mt-3 text-xs text-slate-400">{agency.companyName} · zone {agency.serviceRadiusKm} km</p>
        <nav className="mt-6 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium ${
                (item.href === '/admin' ? pathname === item.href : pathname.startsWith(item.href))
                  ? 'bg-brand text-white' : 'text-ink hover:bg-brand-light'
              }`}
            >
              <span>{item.label}</span>
              {item.section && <Badge count={counts[item.section]} />}
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
