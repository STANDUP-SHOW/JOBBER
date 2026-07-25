import { AgencyAuthProvider } from '../../lib/agency-auth-context';
import AdminShell from '../../components/admin/AdminShell';

export const metadata = {
  title: 'Administration — Services 34',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return (
    <AgencyAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AgencyAuthProvider>
  );
}
