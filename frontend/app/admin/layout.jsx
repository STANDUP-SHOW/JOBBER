'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';

const TABS = [
  { href: '/admin', label: 'Vue d\u2019ensemble' },
  { href: '/admin/verifications', label: 'Vérifications' },
  { href: '/admin/categories', label: 'Catégories' },
  { href: '/admin/users', label: 'Utilisateurs' },
];

export default function AdminLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [loading, user]);

  if (loading || !user || user.role !== 'ADMIN') {
    return <p className="text-slate-400">Vérification des droits d'accès…</p>;
  }

  return (
    <div>
      <span className="label-eyebrow text-moss">Back-office</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Administration</h1>

      <nav className="mt-6 flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-t-md px-4 py-2 text-sm font-medium ${
              pathname === tab.href ? 'border-b-2 border-moss text-moss-dark' : 'text-slate-500 hover:text-ink'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="mt-6">{children}</div>
    </div>
  );
}
