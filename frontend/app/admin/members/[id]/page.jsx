'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../lib/auth-context';

function memberName(m) {
  return m.accountKind === 'COMPANY' ? m.companyName : `${m.firstName || ''} ${m.lastName || ''}`.trim();
}

const STATS = [
  ['missionsPublished', 'Missions publiées'],
  ['offersSent', 'Offres envoyées'],
  ['missionsCompleted', 'Missions réalisées'],
  ['missionsCancelled', 'Missions annulées'],
  ['positiveReviews', 'Avis positifs'],
  ['missionsPaid', 'Missions payées'],
];

export default function AdminMemberDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [member, setMember] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api.adminMember(id, token).then(({ member }) => setMember(member)).catch((e) => setError(e.message));
  }, [token, id]);

  if (error) return <p className="text-clay">{error}</p>;
  if (!member) return <p className="text-slate-400">Chargement…</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/members" className="text-sm text-slate-400 hover:text-moss">← Membres</Link>

      <div className="mt-3 flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-moss-light font-display text-2xl text-moss-dark">
          {member.avatarUrl ? <img src={member.avatarUrl} alt="" className="h-full w-full object-cover" /> : memberName(member)[0]}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-semibold text-ink">{memberName(member)}</h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {member.accountKind === 'COMPANY' ? (member.companyType === 'CORPORATE' ? 'Corporate' : 'Entreprise') : (member.isProfessional ? 'Pro' : 'Particulier')}
            </span>
          </div>
          <p className="text-sm text-slate-500">{member.email} {member.phone && `· ${member.phone}`}</p>
        </div>
        <a href={`mailto:${member.email}`} className="ml-auto shrink-0 rounded-md bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss-dark">
          Contacter
        </a>
      </div>

      <div className="mt-4 space-y-1 text-sm text-slate-500">
        {member.address && <p>{member.address}</p>}
        {(member.companySiret || member.professionalSiret) && <p>SIRET {member.companySiret || member.professionalSiret}</p>}
        <p>Inscrit le {new Date(member.createdAt).toLocaleDateString('fr-FR')}</p>
        {member.providerProfile?.ratingCount > 0 && (
          <p>★ {member.providerProfile.ratingAverage.toFixed(1)} ({member.providerProfile.ratingCount} avis) · {member.providerProfile.completedMissions} missions terminées · portefeuille {member.providerProfile.walletBalance?.toFixed(2)} €</p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {STATS.map(([key, label]) => (
          <div key={key} className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div className="font-display text-2xl font-bold text-ink">{member[key]}</div>
            <div className="text-xs text-slate-400">{label}</div>
          </div>
        ))}
        <div className="rounded-lg border border-moss/30 bg-moss-light p-4 text-center">
          <div className="font-display text-2xl font-bold text-moss-dark">{member.revenue.toFixed(2)} €</div>
          <div className="text-xs text-moss-dark">Chiffre d'affaires</div>
        </div>
      </div>

      {member.providerProfile?.categories?.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-medium text-ink">Compétences</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {member.providerProfile.categories.map((c, i) => (
              <span key={i} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-ink">
                {c.category.icon} {c.category.name} · {c.level} · {c.hourlyRate} €/h
              </span>
            ))}
          </div>
        </div>
      )}

      {member.missions?.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-medium text-ink">Dernières missions publiées</h2>
          <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {member.missions.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-ink">{m.title}</span>
                <span className="text-xs text-slate-400">{m.status} · {new Date(m.createdAt).toLocaleDateString('fr-FR')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {member.offers?.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-medium text-ink">Dernières offres envoyées</h2>
          <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {member.offers.map((o) => (
              <li key={o.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-ink">{o.mission?.title}</span>
                <span className="text-xs text-slate-400">{o.hourlyRate} €/h · {o.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {member.reviewsReceived?.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-medium text-ink">Derniers avis reçus</h2>
          <ul className="mt-2 space-y-2">
            {member.reviewsReceived.map((r, i) => (
              <li key={i} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <div className="font-medium text-ink">★ {r.rating} — {r.author?.firstName}</div>
                {r.comment && <p className="mt-1 text-slate-500">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
