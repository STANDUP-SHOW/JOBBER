'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const activeMarkerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [36, 59],
  iconAnchor: [18, 59],
  popupAnchor: [1, -50],
  shadowSize: [59, 59],
});

const MISSION_ZOOM = 13;
const BELGIUM_CENTER = [50.5039, 4.4699];

// Recenters the map instantly (no pan animation) whenever the active mission changes,
// to mirror the "teleport" feel of stepping through missions with the arrows.
function MapRecenter({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView(target, MISSION_ZOOM, { animate: false });
  }, [target, map]);
  return null;
}

export default function MissionsMap({ missions, providerZone }) {
  const located = useMemo(() => missions.filter((m) => m.lat != null && m.lng != null), [missions]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [located.length]);

  if (missions.length > 0 && located.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
        Aucune de ces missions n'a de localisation renseignée pour le moment.
      </div>
    );
  }

  const active = located[activeIndex];
  const center = active
    ? [active.lat, active.lng]
    : providerZone
      ? [providerZone.lat, providerZone.lng]
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
        <MapContainer center={center} zoom={MISSION_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {active && <MapRecenter target={[active.lat, active.lng]} />}
          {providerZone && (
            <Circle
              center={[providerZone.lat, providerZone.lng]}
              radius={providerZone.radiusKm * 1000}
              pathOptions={{ color: '#2F6F52', fillColor: '#2F6F52', fillOpacity: 0.08, weight: 2 }}
            />
          )}
          {located.map((mission, i) => (
            <Marker
              key={mission.id}
              position={[mission.lat, mission.lng]}
              icon={i === activeIndex ? activeMarkerIcon : markerIcon}
              eventHandlers={{ click: () => setActiveIndex(i) }}
            />
          ))}
        </MapContainer>

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
