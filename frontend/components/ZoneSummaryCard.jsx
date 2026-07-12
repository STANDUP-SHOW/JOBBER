'use client';

import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import ZoneSettingsSheet from './ZoneSettingsSheet';

export default function ZoneSummaryCard() {
  const { user, token, login } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const radiusKm = user.providerProfile?.radiusKm ?? 15;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-left hover:border-moss"
      >
        <span className="text-lg">📍</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">{user.address || "Définir ma zone d'intervention"}</div>
          <div className="text-xs text-slate-400">Rayon : {radiusKm} km</div>
        </div>
        <span className="shrink-0 text-xs font-medium text-moss">Modifier</span>
      </button>

      {open && (
        <ZoneSettingsSheet
          user={user}
          token={token}
          onClose={() => setOpen(false)}
          onSaved={(refreshed) => { login(token, refreshed); setOpen(false); }}
        />
      )}
    </>
  );
}
