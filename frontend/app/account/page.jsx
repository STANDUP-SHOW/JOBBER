'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';

function ChevronIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function Row({ href, icon, label, sublabel, onClick, danger }) {
  const content = (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${danger ? 'text-clay' : 'text-ink'}`}>
      <span className="text-lg">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        {sublabel && <div className="text-xs text-slate-400">{sublabel}</div>}
      </div>
      {!onClick && <ChevronIcon className="h-4 w-4 shrink-0 text-slate-300" />}
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="block w-full text-left">
        {content}
      </button>
    );
  }
  return <Link href={href}>{content}</Link>;
}

function Section({ title, children }) {
  return (
    <div className="mt-6">
      {title && <h2 className="mb-2 text-sm font-semibold text-slate-500">{title}</h2>}
      <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {children}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <span className="label-eyebrow text-moss">Mon compte</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        Bonjour {user.firstName}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {user.role === 'PROVIDER'
          ? 'Votre compte prestataire — vous effectuez des missions.'
          : 'Votre compte employeur — vous publiez des besoins.'}
      </p>

      <Section title="Espace employeur">
        <Row href="/missions/new" icon="📝" label="Publier un besoin" sublabel="Décrire une mission à réaliser" />
        <Row href="/dashboard" icon="📋" label="Mes réservations" sublabel="Suivre vos missions en cours" />
      </Section>

      <Section title="Espace travailleur">
        <Row href="/missions" icon="🔎" label="Missions disponibles" sublabel="Parcourir les besoins près de chez vous" />
        <Row href="/dashboard/profile" icon="🛠️" label="Mon profil prestataire" sublabel="Zone d'intervention, tarif, catégories" />
      </Section>

      {user.role !== 'PROVIDER' && (
        <p className="mt-3 rounded-md bg-moss-light px-4 py-3 text-sm text-moss-dark">
          Votre compte est actuellement enregistré comme employeur. Pour candidater aux missions, contactez-nous pour activer le volet prestataire.
        </p>
      )}

      <Section title="Informations utiles">
        <Row href="/messages" icon="💬" label="Messagerie" />
        {user.role === 'ADMIN' && <Row href="/admin" icon="🛡️" label="Back-office" />}
        <Row onClick={logout} icon="🚪" label="Se déconnecter" danger />
      </Section>
    </div>
  );
}
