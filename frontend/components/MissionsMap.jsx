'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

const BELGIUM_CENTER = [50.5039, 4.4699];

export default function MissionsMap({ missions }) {
  const located = useMemo(() => missions.filter((m) => m.lat != null && m.lng != null), [missions]);

  const center = located.length
    ? [
        located.reduce((sum, m) => sum + m.lat, 0) / located.length,
        located.reduce((sum, m) => sum + m.lng, 0) / located.length,
      ]
    : BELGIUM_CENTER;

  if (missions.length > 0 && located.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
        Aucune de ces missions n'a de localisation renseignée pour le moment.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-slate-200" style={{ height: '520px' }}>
      <MapContainer center={center} zoom={located.length ? 11 : 8} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((mission) => (
          <Marker key={mission.id} position={[mission.lat, mission.lng]} icon={markerIcon}>
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{mission.title}</div>
                <div className="text-slate-500">{mission.category?.name}</div>
                <Link href={`/missions/${mission.id}`} className="mt-1 inline-block text-moss-dark underline">
                  Voir la mission
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
