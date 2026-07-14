'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { api } from '../../lib/api';
import AvatarUpload from '../../components/AvatarUpload';
import ZoneSummaryCard from '../../components/ZoneSummaryCard';

function ChevronIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function Row({ href, icon, label, sublabel, value, onClick, danger }) {
  const content = (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${danger ? 'text-clay' : 'text-ink'}`}>
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

export default function AccountPage() {
  const { user, token, login, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [loading, user]);

  if (!user) return null;

  async function onAvatarUploaded(url) {
    const { user: updated } = await api.updateMe({ avatarUrl: url }, token);
    login(token, updated);
  }

  return (
    <div className="mx-auto max-w-xl">
      <span className="label-eyebrow text-moss">Mon compte</span>

      <div className="mt-4">
        <AvatarUpload avatarUrl={user.avatarUrl} firstName={user.firstName} onUploaded={onAvatarUploaded} />
      </div>

      <h1 className="mt-4 font-display text-3xl font-semibold text-ink">
        Bonjour {user.firstName}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Publiez des besoins et proposez vos services, le tout depuis un seul compte.
      </p>

      <Section title="Espace manager">
        <Row href="/missions/new" icon="📝" label="Publier un besoin" sublabel="Décrire une mission à réaliser" />
        <Row href="/dashboard" icon="📋" label="Mes réservations" sublabel="Suivre vos missions en cours" />
      </Section>

      <Section title="Espace jobber">
        <Row href="/missions" icon="🔎" label="Missions disponibles" sublabel="Parcourir les besoins près de chez vous" />
        <Row href="/dashboard/offers" icon="📨" label="Mes offres" sublabel="Missions auxquelles vous avez postulé" />
        <Row href="/dashboard/profile" icon="🛠️" label="Mon profil jobber" sublabel="Zone d'intervention, tarif, catégories" />
        <Row
          href="/dashboard/wallet"
          icon="💶"
          label={`Portefeuille — ${(user.providerProfile?.walletBalance ?? 0).toFixed(2)} €`}
          sublabel={user.providerProfile?.payoutsEnabled ? 'Paiements activés' : 'Paiements non configurés'}
        />
      </Section>

      <div className="mt-3">
        <ZoneSummaryCard />
      </div>

      <Section title="Gérer mon compte">
        <Row href="/account/personal-info" icon="👤" label="Informations personnelles" />
        <Row href="/account/balance" icon="💰" label="Mon solde" value={`${(user.creditBalance ?? 0).toFixed(2)} €`} />
        <Row href="/account/cesu" icon="🎫" label="Mes tickets CESU" />
        <Row href="/account/payment-methods" icon="💳" label="Moyens de paiement" />
        <Row href="/account/tax-certificates" icon="📄" label="Attestations fiscales" />
        <Row href="/account/notifications" icon="🔔" label="Gérer mes notifications" />
        <Row href="/account/language" icon="🌐" label="Langage" value="Français" />
      </Section>

      <Section title="Produit">
        <Row href="/account/tax-credit" icon="📋" label="Déclaratif et crédit d'impôt" sublabel="Gagnez du temps et baissez vos impôts." />
        <Row href="/account/invite-friends" icon="🎁" label="Inviter des amis" sublabel="Gagnez 5 % du montant dépensé par vos amis" />
      </Section>

      <Section title="Informations utiles">
        <Row href="/messages" icon="💬" label="Messagerie" />
        {user.role === 'ADMIN' && <Row href="/admin" icon="🛡️" label="Back-office" />}
        <Row onClick={logout} icon="🚪" label="Se déconnecter" danger />
      </Section>
    </div>
  );
}
