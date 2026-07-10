'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ChatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

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
