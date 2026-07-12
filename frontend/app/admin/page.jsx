'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../lib/auth-context';

export default function AdminOverviewPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) api.adminStats(token).then(setStats).catch((e) => setError(e.message));
  }, [token]);

  if (error) return <p className="text-clay">{error}</p>;
  if (!stats) return <p className="text-slate-400">Chargement…</p>;

  const cards = [
    { label: 'Utilisateurs', value: stats.totalUsers, sub: `${stats.totalMissionPosters} ont publié · ${stats.totalActiveJobbers} ont un profil jobber actif` },
    { label: 'Revenu plateforme', value: `${stats.platformRevenue.toFixed(2)} €`, sub: `${stats.grossVolume.toFixed(2)} € de volume traité` },
    { label: 'Vérifications en attente', value: stats.pendingVerifications, sub: 'Documents à examiner', highlight: stats.pendingVerifications > 0 },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-lg border p-5 ${c.highlight ? 'border-ochre bg-ochre-light' : 'border-slate-200 bg-white'}`}>
            <div className="text-xs font-medium text-slate-500">{c.label}</div>
            <div className="mt-1 font-display text-3xl font-semibold text-ink">{c.value}</div>
            <div className="mt-1 text-xs text-slate-400">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <StatusBreakdown title="Missions par statut" data={stats.missionsByStatus} />
        <StatusBreakdown title="Réservations par statut" data={stats.bookingsByStatus} />
      </div>
    </div>
  );
}

function StatusBreakdown({ title, data }) {
  const entries = Object.entries(data || {});
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="font-display text-lg font-medium text-ink">{title}</div>
      <div className="mt-3 space-y-2">
        {entries.length === 0 && <p className="text-sm text-slate-400">Aucune donnée.</p>}
        {entries.map(([status, count]) => (
          <div key={status} className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{status}</span>
            <span className="font-mono font-medium text-ink">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
