import './globals.css';
import { AuthProvider } from '../lib/auth-context';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Jobber — Services à domicile',
  description: "Trouvez ou proposez un service à domicile : ménage, bricolage, jardinage, garde d'enfants et plus.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="font-body">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">{children}</main>
          <footer className="border-t border-slate-200 py-8 text-center text-xs text-slate-400">
            Jobber — projet pédagogique.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
