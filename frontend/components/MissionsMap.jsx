'use client';

import { useEffect, useMemo, useState } from 'react';
import { GoogleMap, Marker, Circle, useJsApiLoader } from '@react-google-maps/api';
import Link from 'next/link';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const MISSION_ZOOM = 13;
const BELGIUM_CENTER = { lat: 50.5039, lng: 4.4699 };

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: true,
  clickableIcons: false,
};

export default function MissionsMap({ missions, providerZone }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'jobber-google-maps',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
  });

  const located = useMemo(() => missions.filter((m) => m.lat != null && m.lng != null), [missions]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [map, setMap] = useState(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [located.length]);

  const active = located[activeIndex];

  useEffect(() => {
    if (map && active) {
      map.panTo({ lat: active.lat, lng: active.lng });
    }
  }, [map, active?.id]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
        Carte non configurée — il manque la clé Google Maps (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-clay">
        Impossible de charger Google Maps.
      </div>
    );
  }

  if (missions.length > 0 && located.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
        Aucune de ces missions n'a de localisation renseignée pour le moment.
      </div>
    );
  }

  if (!isLoaded) {
    return <p className="mt-6 text-slate-400">Chargement de la carte…</p>;
  }

  const center = active
    ? { lat: active.lat, lng: active.lng }
    : providerZone
      ? { lat: providerZone.lat, lng: providerZone.lng }
      : BELGIUM_CENTER;

  function go(delta) {
    setActiveIndex((i) => (i + delta + located.length) % located.length);
  }

  return (
    <div className="mt-6">
      {providerZone && (
        <p className="mb-2 text-xs text-slate-400">
          {located.length} mission{located.length > 1 ? 's' : ''} dans votre zone d'intervention ({providerZone.radiusKm} km)
        </p>
      )}

      <div className="relative overflow-hidden rounded-lg border border-slate-200" style={{ height: 'min(600px, 70vh)' }}>
        <GoogleMap
          onLoad={setMap}
          center={center}
          zoom={MISSION_ZOOM}
          mapContainerStyle={{ height: '100%', width: '100%' }}
          options={MAP_OPTIONS}
        >
          {providerZone && (
            <Circle
              center={{ lat: providerZone.lat, lng: providerZone.lng }}
              radius={providerZone.radiusKm * 1000}
              options={{
                strokeColor: '#0B66FF',
                strokeWeight: 2,
                fillColor: '#0B66FF',
                fillOpacity: 0.08,
              }}
            />
          )}
          {located.map((mission, i) => (
            <Marker
              key={mission.id}
              position={{ lat: mission.lat, lng: mission.lng }}
              onClick={() => setActiveIndex(i)}
              opacity={i === activeIndex ? 1 : 0.75}
              zIndex={i === activeIndex ? 10 : 1}
            />
          ))}
        </GoogleMap>

        {active && (
          <div className="absolute inset-x-3 bottom-3 z-[1100] flex items-center gap-2">
            {located.length > 1 && (
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Mission précédente"
                className="shrink-0 rounded-full bg-white p-3 text-ink shadow-lg hover:bg-slate-50"
              >
                ←
              </button>
            )}

            <Link
              href={`/missions/${active.id}`}
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
            >
              <span className="label-eyebrow text-moss">{active.category?.name}</span>
              <div className="mt-1 truncate font-display text-lg font-medium text-ink">{active.title}</div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{active.description}</p>
              <div className="mt-2 truncate text-xs text-slate-400">{active.address}</div>
            </Link>

            {located.length > 1 && (
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Mission suivante"
                className="shrink-0 rounded-full bg-white p-3 text-ink shadow-lg hover:bg-slate-50"
              >
                →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
