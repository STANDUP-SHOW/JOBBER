'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { HomeIcon, SearchIcon, ChatIcon, UserIcon, PlusIcon } from './NavIcons';

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = [
    { href: '/', label: 'Accueil', icon: HomeIcon },
    { href: '/missions', label: 'Missions', icon: SearchIcon },
    { href: '/missions/new', label: 'Publier', icon: PlusIcon, primary: true },
    { href: '/messages', label: 'Messagerie', icon: ChatIcon },
    { href: user ? '/account' : '/auth/login', label: 'Compte', icon: UserIcon },
  ];

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1200] border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-xl items-end justify-between px-4 pb-2 pt-2">
        {items.map(({ href, label, icon: Icon, primary }) => {
          const active = isActive(href);
          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="-mt-6 flex flex-col items-center gap-1"
                aria-label={label}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-moss text-white shadow-lg shadow-moss/30">
                  <Icon className="h-6 w-6" />
                </span>
              </Link>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-1 text-xs font-medium ${active ? 'text-moss' : 'text-slate-400'}`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
