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

// Desktop-only persistent left nav for /account/* — condensed mirror of the
// full menu on the /account hub page itself (see app/account/page.jsx),
// so the two never drift into different route lists. Hidden below `lg`:
// mobile keeps its existing full-page nav-in/back-out behavior untouched.
export default function AccountSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;
  const isCompany = user.accountKind === 'COMPANY';
  const active = (href) => pathname === href;

  return (
    <nav className="hidden lg:block lg:w-64 lg:shrink-0">
      <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-3">
        <Row href="/account" icon="🏠" label="Vue d'ensemble" active={active('/account')} />

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
          </>
        ) : (
          <Group title="Manager">
            <Row href="/missions/new" icon="📝" label="Publier un besoin" active={active('/missions/new')} />
            <Row href="/dashboard/manager-missions" icon="📋" label="Suivi de missions" active={active('/dashboard/manager-missions')} />
            <Row href="/dashboard/manager-completed" icon="✅" label="Missions terminées" active={active('/dashboard/manager-completed')} />
            <Row href="/account/favorites" icon="⭐" label="Mes jobbers favoris" active={active('/account/favorites')} />
            <Row href="/account/subscription" icon="💼" label="Cartes Manager" active={active('/account/subscription')} />
          </Group>
        )}

        {!isCompany && (
          <Group title="Jobber">
            <Row href="/dashboard/profile" icon="🛠️" label="Mon profil Jobber" active={active('/dashboard/profile')} />
            <Row href="/dashboard/schedule" icon="🗓️" label="Missions à réaliser" active={active('/dashboard/schedule')} />
            <Row href="/dashboard" icon="📅" label="Missions réservées" active={active('/dashboard')} />
            <Row href="/dashboard/offers" icon="📨" label="Mes offres" active={active('/dashboard/offers')} />
            <Row href="/dashboard/wallet" icon="💶" label="Mon portefeuille" active={active('/dashboard/wallet')} />
            <Row href="/account/reviews" icon="🌟" label="Mes évaluations" active={active('/account/reviews')} />
            <Row href="/account/badges" icon="🏅" label="Badges et récompenses" active={active('/account/badges')} />
          </Group>
        )}

        {!isCompany && (
          <Group title="Formation">
            <Row href="/account/diplomas" icon="🎓" label="Diplômes et titres" active={active('/account/diplomas')} />
            <Row href="/account/teach-lessons" icon="📖" label="Donner des cours" active={active('/account/teach-lessons')} />
            <Row href="/account/lesson-history" icon="🕓" label="Historique formation" active={active('/account/lesson-history')} />
          </Group>
        )}

        <Group title="Compte">
          <Row href="/account/personal-info" icon="👤" label="Informations personnelles" active={active('/account/personal-info')} />
          <Row href="/account/balance" icon="💰" label="Mon solde" active={active('/account/balance')} />
          {!isCompany && <Row href="/account/payment-methods" icon="💳" label="Moyens de paiement" active={active('/account/payment-methods')} />}
          {!isCompany && <Row href="/account/invoices" icon="🧾" label="Mes factures" active={active('/account/invoices')} />}
          <Row href="/account/tax-certificates" icon="📄" label="Attestations fiscales" active={active('/account/tax-certificates')} />
          <Row href="/account/notifications" icon="🔔" label="Notifications" active={active('/account/notifications')} />
        </Group>

        <Group>
          <Row href="/messages" icon="💬" label="Messagerie" active={active('/messages')} />
          <Row href="/contact" icon="✉️" label="Nous contacter" active={active('/contact')} />
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-clay hover:bg-clay/5"
          >
            <span className="text-base leading-none">🚪</span>
            Se déconnecter
          </button>
        </Group>
      </div>
    </nav>
  );
}
