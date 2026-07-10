'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
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

// Recenters the map instantly (no pan animation) whenever the active mission changes,
// to mirror the "teleport" feel of swiping through the mission carousel.
function MapRecenter({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView(target, map.getZoom(), { animate: false });
  }, [target, map]);
  return null;
}

export default function MissionsMap({ missions }) {
  const located = useMemo(() => missions.filter((m) => m.lat != null && m.lng != null), [missions]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const cardRefs = useRef([]);

  useEffect(() => {
    setActiveIndex(0);
  }, [located.length]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || !located.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setActiveIndex(Number(entry.target.dataset.index));
          }
        });
      },
      { root: container, threshold: [0.6] }
    );

    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [located]);

  function selectFromMarker(i) {
    setActiveIndex(i);
    cardRefs.current[i]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  if (missions.length > 0 && located.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
        Aucune de ces missions n'a de localisation renseignée pour le moment.
      </div>
    );
  }

  const active = located[activeIndex];

  return (
    <div className="relative mt-6 overflow-hidden rounded-lg border border-slate-200" style={{ height: '560px' }}>
      <MapContainer center={[active.lat, active.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter target={[active.lat, active.lng]} />
        {located.map((mission, i) => (
          <Marker
            key={mission.id}
            position={[mission.lat, mission.lng]}
            icon={i === activeIndex ? activeMarkerIcon : markerIcon}
            eventHandlers={{ click: () => selectFromMarker(i) }}
          />
        ))}
      </MapContainer>

      <div
        ref={scrollRef}
        className="no-scrollbar absolute inset-x-0 bottom-0 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 pt-2"
      >
        {located.map((mission, i) => (
          <Link
            key={mission.id}
            href={`/missions/${mission.id}`}
            data-index={i}
            ref={(el) => { cardRefs.current[i] = el; }}
            className={`w-[85%] shrink-0 snap-center rounded-lg border bg-white p-4 shadow-md transition sm:w-[320px] ${
              i === activeIndex ? 'border-moss' : 'border-slate-200'
            }`}
          >
            <span className="label-eyebrow text-moss">{mission.category?.name}</span>
            <div className="mt-1 font-display text-lg font-medium text-ink">{mission.title}</div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{mission.description}</p>
            <div className="mt-2 text-xs text-slate-400">{mission.address}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
