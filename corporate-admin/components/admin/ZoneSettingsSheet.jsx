'use client';

import { useState } from 'react';
import { GoogleMap, Circle, useJsApiLoader } from '@react-google-maps/api';
import { agencyApi } from '../../lib/agencyApi';
import { GOOGLE_MAPS_LIBRARIES } from '../../lib/googleMapsLibraries';
import AddressAutocomplete from '../AddressAutocomplete';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const BEZIERS_CENTER = { lat: 43.3444, lng: 3.2158 };

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  clickableIcons: false,
  gestureHandling: 'none',
};

export default function ZoneSettingsSheet({ agency, token, onClose, onSaved }) {
  const { isLoaded } = useJsApiLoader({
    id: 'corporate-admin-google-maps',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [address, setAddress] = useState(agency.address || '');
  const [radiusKm, setRadiusKm] = useState(agency.serviceRadiusKm ?? 50);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const center = agency.lat != null && agency.lng != null ? { lat: agency.lat, lng: agency.lng } : BEZIERS_CENTER;

  async function onSubmit() {
    setBusy(true);
    setError('');
    try {
      const payload = { serviceRadiusKm: Number(radiusKm) };
      if (address && address !== agency.address) payload.address = address;
      const { agency: updated } = await agencyApi.updateCredentials(payload, token);
      onSaved(updated);
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

        <h2 className="text-center font-display text-lg font-semibold text-ink">Zone d'intervention</h2>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200" style={{ height: '220px' }}>
          {GOOGLE_MAPS_API_KEY && isLoaded ? (
            <GoogleMap center={center} zoom={9} mapContainerStyle={{ height: '100%', width: '100%' }} options={MAP_OPTIONS}>
              {agency.lat != null && agency.lng != null && (
                <Circle
                  center={center}
                  radius={radiusKm * 1000}
                  options={{ strokeColor: '#123E7A', strokeWeight: 2, fillColor: '#123E7A', fillOpacity: 0.12 }}
                />
              )}
            </GoogleMap>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Renseignez l'adresse de l'entreprise pour voir l'aperçu
            </div>
          )}
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-medium text-slate-500">Adresse entreprise</span>
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            placeholder="Ex : 12 Avenue de la Gare, Béziers"
          />
        </label>

        <div className="mt-5">
          <div className="flex justify-center">
            <span className="rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-white">{radiusKm} km</span>
          </div>
          <input
            type="range"
            min={1}
            max={150}
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="mt-2 w-full accent-brand"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-400">
            <span>1</span>
            <span>150</span>
          </div>
        </div>

        {error && <p className="mt-3 rounded-md bg-clay/10 px-3 py-2 text-sm text-clay">{error}</p>}

        <button
          type="button"
          disabled={busy}
          onClick={onSubmit}
          className="mt-5 w-full rounded-full bg-brand py-4 text-base font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
