'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AccountSidebar from './AccountSidebar';
import { useAuth } from '../lib/auth-context';

function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

// Shared shell for the whole "my account" app area (Compte / Dashboard /
// Messagerie): one persistent sidebar, fixed on desktop, collapsing to a
// hamburger-triggered drawer on mobile — same nav everywhere instead of
// each route tree inventing its own header/back-button pattern.
export default function DashboardShell({ children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => { setOpen(false); }, [pathname]);

  // Guest-accessible routes (missions, lessons…) also use this shell so the
  // nav is consistent once logged in — but with no user there's nothing to
  // navigate to yet, so render children with zero extra chrome instead of
  // an empty hamburger/sidebar.
  if (!user) return children;

  return (
    <div className="lg:flex lg:items-start">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="mb-4 flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink lg:hidden"
      >
        <MenuIcon className="h-4 w-4" />
        Menu
      </button>

      {open && (
        <div className="fixed inset-0 z-[1400] lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-white p-4 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer le menu"
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            <AccountSidebar />
          </div>
        </div>
      )}

      <div className="hidden lg:block lg:w-60 lg:shrink-0 lg:border-r lg:border-slate-200 lg:pr-4">
        <div className="sticky top-6">
          <AccountSidebar />
        </div>
      </div>

      <div className="lg:min-w-0 lg:flex-1 lg:pl-6">{children}</div>
    </div>
  );
}
