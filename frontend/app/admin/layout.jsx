'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';

const TABS = [
  { href: '/admin', label: "Vue d'ensemble" },
  { href: '/admin/verifications', label: 'Vérifications', section: 'verifications' },
  { href: '/admin/categories', label: 'Catégories' },
  { href: '/admin/users', label: 'Utilisateurs' },
  { href: '/admin/members', label: 'Membres', section: 'members' },
  { href: '/admin/contact-messages', label: 'Messages', section: 'contact-messages' },
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

export default function AdminLayout({ children }) {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [counts, setCounts] = useState({});

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [loading, user]);

  useEffect(() => {
    if (!token || !user || user.role !== 'ADMIN') return;
    let cancelled = false;
    function refresh() {
      api.adminNotificationCounts(token).then(({ counts }) => { if (!cancelled) setCounts(counts); }).catch(() => {});
    }
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [token, user]);

  useEffect(() => {
    if (!token) return;
    const tab = TABS.find((t) => (t.href === '/admin' ? pathname === t.href : pathname.startsWith(t.href)));
    if (tab?.section) {
      api.adminMarkSectionSeen(tab.section, token).then(() => {
        setCounts((c) => ({ ...c, [tab.section]: 0 }));
      }).catch(() => {});
    }
  }, [pathname, token]);

  if (loading || !user || user.role !== 'ADMIN') {
    return <p className="text-slate-400">Vérification des droits d'accès…</p>;
  }

  return (
    <div>
      <span className="label-eyebrow text-moss">Back-office</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Administration</h1>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center rounded-t-md px-4 py-2 text-sm font-medium ${
              (tab.href === '/admin' ? pathname === tab.href : pathname.startsWith(tab.href))
                ? 'border-b-2 border-moss text-moss-dark' : 'text-slate-500 hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.section && <Badge count={counts[tab.section]} />}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
