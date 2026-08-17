'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../lib/auth-context';

function Row({ href, icon, label, active }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
        active ? 'bg-moss-light font-medium text-moss-dark' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </Link>
  );
}

function Group({ title, children }) {
  return (
    <div className="mt-5 first:mt-0">
      {title && <h3 className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

// The one nav used everywhere in the account/dashboard/messages app area —
// rendered by DashboardShell, either as the fixed desktop column or inside
// the mobile drawer, so there's a single source of truth for "what pages
// exist and where they link." Covers every destination that used to live
// only in the /account hub page's own menu list (now removed from there
// to avoid the sidebar/hub duplicating each other).
export default function AccountSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;
  const isCompany = user.accountKind === 'COMPANY';
  const active = (href) => pathname === href;

  return (
    <nav>
      <Link href="/account" className="mb-4 flex items-center gap-2 px-3 text-sm font-medium text-ink">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-moss-light font-display text-sm text-moss-dark">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user.firstName?.[0]}
        </span>
        {isCompany ? user.companyName : user.firstName}
      </Link>

      {!isCompany && (
        <Group>
          <Row href="/account/subscription" icon="💼" label="Cartes Jobber+" active={active('/account/subscription')} />
        </Group>
      )}

      {isCompany ? (
        <>
          <Group title="Entreprise">
            <Row href="/missions/new" icon="📝" label="Publier un besoin" active={active('/missions/new')} />
            <Row href="/dashboard" icon="📋" label="Mes besoins en cours" active={active('/dashboard')} />
            <Row href="/account/subscription" icon="⭐" label="Cartes" active={active('/account/subscription')} />
          </Group>
          <Group title="Gestion">
            <Row href="/account/company-info" icon="🏢" label="Informations entreprise" active={active('/account/company-info')} />
            <Row href="/account/invoices" icon="🧾" label="Mes factures" active={active('/account/invoices')} />
            <Row href="/account/payment-methods" icon="💳" label="Moyens de paiement" active={active('/account/payment-methods')} />
          </Group>
          <Group title="Corporate">
            <Row href="/account/jobber-plus" icon="🚀" label="Espace Corporate" active={active('/account/jobber-plus')} />
          </Group>
        </>
      ) : (
        <Group title="Manager">
          <Row href="/missions/new" icon="📝" label="Publier un besoin" active={active('/missions/new')} />
          <Row href="/dashboard/manager-missions" icon="📋" label="Suivi de missions" active={active('/dashboard/manager-missions')} />
          <Row href="/dashboard/manager-completed" icon="✅" label="Missions terminées" active={active('/dashboard/manager-completed')} />
          <Row href="/account/favorites" icon="⭐" label="Mes jobbers favoris" active={active('/account/favorites')} />
        </Group>
      )}

      {!isCompany && (
        <Group title="Jobber">
          <Row href="/dashboard/profile" icon="🛠️" label="Mon profil Jobber" active={active('/dashboard/profile')} />
          <Row href="/dashboard/schedule" icon="🗓️" label="Missions à réaliser" active={active('/dashboard/schedule')} />
          <Row href="/missions" icon="🔎" label="Missions disponibles" active={active('/missions')} />
          <Row href="/dashboard/offers" icon="📨" label="Mes offres" active={active('/dashboard/offers')} />
          <Row href="/dashboard/jobber-history" icon="🗂️" label="Historique de missions" active={active('/dashboard/jobber-history')} />
          <Row href="/dashboard/wallet" icon="💶" label="Mon portefeuille" active={active('/dashboard/wallet')} />
          <Row href="/account/reviews" icon="🌟" label="Mes évaluations" active={active('/account/reviews')} />
          <Row href="/account/badges" icon="🏅" label="Badges et récompenses" active={active('/account/badges')} />
        </Group>
      )}

      {!isCompany && (
        <Group title="Formation">
          <Row href="/account/diplomas" icon="🎓" label="Diplômes et titres" active={active('/account/diplomas')} />
          <Row href="/account/teach-lessons" icon="📖" label="Donner des cours" active={active('/account/teach-lessons')} />
          <Row href="/lessons" icon="📚" label="Consulter les cours" active={active('/lessons')} />
          <Row href="/account/lesson-history" icon="🕓" label="Historique formation" active={active('/account/lesson-history')} />
        </Group>
      )}

      <Group title="Compte">
        <Row href="/account/personal-info" icon="👤" label="Informations personnelles" active={active('/account/personal-info')} />
        <Row href="/account/balance" icon="💰" label="Mon solde" active={active('/account/balance')} />
        {!isCompany && <Row href="/account/cesu" icon="🎫" label="Tickets CESU" active={active('/account/cesu')} />}
        {!isCompany && <Row href="/account/payment-methods" icon="💳" label="Moyens de paiement" active={active('/account/payment-methods')} />}
        {!isCompany && <Row href="/account/invoices" icon="🧾" label="Mes factures" active={active('/account/invoices')} />}
        <Row href="/account/tax-certificates" icon="📄" label="Attestations fiscales" active={active('/account/tax-certificates')} />
        {!isCompany && <Row href="/account/tax-credit" icon="📋" label="Crédit d'impôt" active={active('/account/tax-credit')} />}
        <Row href="/account/notifications" icon="🔔" label="Notifications" active={active('/account/notifications')} />
        <Row href="/account/language" icon="🌐" label="Langue" active={active('/account/language')} />
      </Group>

      <Group>
        <Row href="/messages" icon="💬" label="Messagerie" active={active('/messages')} />
        <Row href="/account/invite-friends" icon="🎁" label="Inviter des amis" active={active('/account/invite-friends')} />
        <Row href="/contact" icon="✉️" label="Nous contacter" active={active('/contact')} />
        {user.role === 'ADMIN' && <Row href="/admin" icon="🛡️" label="Back-office" active={pathname.startsWith('/admin')} />}
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-clay hover:bg-clay/5"
        >
          <span className="text-base leading-none">🚪</span>
          Se déconnecter
        </button>
      </Group>
    </nav>
  );
}
