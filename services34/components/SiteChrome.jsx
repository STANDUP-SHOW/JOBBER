'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';

// admin.services34.fr rewrites to /admin/* (see middleware.js) — that
// section has its own layout/shell entirely, so the public marketing
// Header/Footer and page width must not wrap it.
export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) return children;

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">{children}</main>
      <Footer />
    </>
  );
}
