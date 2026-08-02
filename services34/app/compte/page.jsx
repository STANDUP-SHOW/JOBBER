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

function Row({ href, icon, label, sublabel, value, onClick, danger }) {
  const content = (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${danger ? 'text-red-600' : 'text-ink'}`}>
      <span className="text-lg">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        {sublabel && <div className="text-xs text-slate-400">{sublabel}</div>}
      </div>
      {value && <span className="shrink-0 text-sm text-slate-400">{value}</span>}
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

export default function ComptePage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login?next=/compte');
  }, [loading, user, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-xl">
      <span className="text-sm font-semibold uppercase tracking-wide text-brand">Mon compte</span>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Bonjour {user.firstName}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Publiez vos besoins et suivez vos prestations, le tout depuis un seul compte.
      </p>

      <Section title="Mon activité">
        <Row href="/demande" icon="📝" label="Publier un besoin" sublabel="Décrire une mission à réaliser" />
        <Row href="/compte/missions" icon="📋" label="Suivi de missions" sublabel="Missions en cours et offres reçues" />
        <Row href="/compte/missions-terminees" icon="✅" label="Missions terminées" />
        <Row href="/compte/factures" icon="🧾" label="Mes factures" />
      </Section>

      <Section title="Gérer mon compte">
        <Row href="/compte/informations-personnelles" icon="👤" label="Informations personnelles" />
        <Row href="/compte/solde" icon="💰" label="Mon solde" value={`${(user.creditBalance ?? 0).toFixed(2)} €`} />
        <Row href="/compte/cesu" icon="🎫" label="Mes tickets CESU" />
        <Row href="/compte/moyens-paiement" icon="💳" label="Moyens de paiement" />
        <Row href="/compte/attestations-fiscales" icon="📄" label="Attestations fiscales" />
        <Row href="/compte/notifications" icon="🔔" label="Gérer mes notifications" />
        <Row href="/compte/langue" icon="🌐" label="Langage" value="Français" />
      </Section>

      <Section title="Produit">
        <Row href="/credit-impot" icon="📋" label="Déclaratif et crédit d'impôt" sublabel="Gagnez du temps et baissez vos impôts." />
      </Section>

      <Section title="Informations utiles">
        <Row href="/contact" icon="✉️" label="Nous contacter" />
        <Row href="/messages" icon="💬" label="Messagerie" />
        <Row onClick={() => { logout(); router.push('/'); }} icon="🚪" label="Se déconnecter" danger />
      </Section>
    </div>
  );
}
