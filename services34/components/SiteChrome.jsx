'use client';

import Header from './Header';
import Footer from './Footer';

// admin.services34.fr is its own separate app (corporate-admin/, shared
// with every other corporate platform) — this app no longer serves any
// /admin section itself, so SiteChrome always wraps with the public
// marketing Header/Footer.
export default function SiteChrome({ children }) {
  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">{children}</main>
      <Footer />
    </>
  );
}
