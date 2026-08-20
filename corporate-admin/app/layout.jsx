import './globals.css';
import { AgencyAuthProvider } from '../lib/agency-auth-context';
import { BrandProvider } from '../lib/brand-context';
import AdminShell from '../components/admin/AdminShell';

// Generic — the real per-platform name shows in the sidebar/login screen
// (resolved client-side from the hostname, see lib/brand-context.jsx),
// not in this static tab title shared by every corporate platform.
export const metadata = {
  title: 'Administration — Espace corporate',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="font-body">
        <BrandProvider>
          <AgencyAuthProvider>
            <AdminShell>{children}</AdminShell>
          </AgencyAuthProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
