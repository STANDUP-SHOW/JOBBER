import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import BottomNav from '../components/BottomNav';

export const metadata = {
  title: 'Jobber — Services à domicile',
  description: "Trouvez ou proposez un service à domicile : ménage, bricolage, jardinage, garde d'enfants et plus.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="font-body">
        <AuthProvider>
          <main className="mx-auto min-h-screen max-w-6xl px-6 pb-28 pt-6">{children}</main>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
