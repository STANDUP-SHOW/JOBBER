'use client';

import { useState } from 'react';
import { GoogleMap, Circle, useJsApiLoader } from '@react-google-maps/api';
import { api } from '../lib/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const BELGIUM_CENTER = { lat: 50.5039, lng: 4.4699 };

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  clickableIcons: false,
  gestureHandling: 'none',
};

export default function ZoneSettingsSheet({ user, token, onClose, onSaved }) {
  const { isLoaded } = useJsApiLoader({
    id: 'jobber-google-maps',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
  });

  const [address, setAddress] = useState(user.address || '');
  const [radiusKm, setRadiusKm] = useState(user.providerProfile?.radiusKm ?? 15);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const center = user.lat != null && user.lng != null ? { lat: user.lat, lng: user.lng } : BELGIUM_CENTER;

  async function onSubmit() {
    setBusy(true);
    setError('');
    try {
      await api.updateProviderProfile({ address, radiusKm: Number(radiusKm) }, token);
      const { user: refreshed } = await api.me(token);
      onSaved(refreshed);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-end justify-center bg-ink/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 pb-8" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-slate-200" />

        <h2 className="text-center font-display text-lg font-semibold text-ink">Rayon d'intervention</h2>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200" style={{ height: '220px' }}>
          {GOOGLE_MAPS_API_KEY && isLoaded ? (
            <GoogleMap center={center} zoom={9} mapContainerStyle={{ height: '100%', width: '100%' }} options={MAP_OPTIONS}>
              {user.lat != null && user.lng != null && (
                <Circle
                  center={center}
                  radius={radiusKm * 1000}
                  options={{ strokeColor: '#0B66FF', strokeWeight: 2, fillColor: '#0B66FF', fillOpacity: 0.12 }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Renseignez votre adresse pour voir l'aperçu
            </div>
          )}
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-slate-500">Code postal / Adresse</span>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex : 34300 Agde"
            className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-moss"
          />
        </label>

        <div className="mt-5">
          <div className="flex justify-center">
            <span className="rounded-full bg-moss px-4 py-1.5 text-sm font-semibold text-white">{radiusKm} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="mt-2 w-full accent-moss"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>1</span>
            <span>50</span>
          </div>
        </div>

        {error && <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button
          type="button"
          disabled={busy}
          onClick={onSubmit}
          className="mt-5 w-full rounded-full bg-moss py-4 text-base font-semibold text-white hover:bg-moss-dark disabled:opacity-60"
        >
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
