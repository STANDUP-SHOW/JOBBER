'use client';

import Link from 'next/link';
import { useAuth } from '../lib/auth-context';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl font-semibold text-ink">Jobber</span>
          <span className="label-eyebrow text-moss">beta</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium text-ink">
          {(!user || user.role === 'CLIENT') && (
            <Link href="/missions/new" className="hidden sm:inline hover:text-moss">Publier un besoin</Link>
          )}
          {user?.role === 'PROVIDER' && (
            <>
              <Link href="/missions" className="hidden sm:inline hover:text-moss">Missions disponibles</Link>
              <Link href="/dashboard/profile" className="hidden sm:inline hover:text-moss">Mon profil</Link>
            </>
          )}
          {user ? (
            <>
              <Link href="/messages" className="hover:text-moss">Messages</Link>
              <Link href="/dashboard" className="hover:text-moss">Tableau de bord</Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="hover:text-moss">Back-office</Link>
              )}
              <button onClick={logout} className="rounded-md border border-slate-200 px-3 py-1.5 hover:border-moss hover:text-moss">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-moss">Connexion</Link>
              <Link href="/auth/register" className="rounded-md bg-ink px-4 py-2 text-paper hover:bg-moss-dark">
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
