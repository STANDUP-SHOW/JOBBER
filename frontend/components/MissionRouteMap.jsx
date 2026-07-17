'use client';

import { useEffect, useMemo, useState } from 'react';
import { GoogleMap, Marker, DirectionsService, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_LIBRARIES } from '../lib/googleMapsLibraries';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const MAP_OPTIONS = { disableDefaultUI: true, zoomControl: false, clickableIcons: false, gestureHandling: 'none' };
const ROUTE_OPTIONS = {
  suppressMarkers: false,
  polylineOptions: { strokeColor: '#0B66FF', strokeWeight: 4, strokeOpacity: 0.9 },
};

// Route map on a mission's detail page. With a fixed `origin` (e.g. a
// transport mission's departure point), draws that route directly. Otherwise
// geolocates the jobber and draws a driving route to the (privacy-jittered
// while OPEN) mission pin. Shows the distance badge either way. Falls back
// to a plain centered map if geolocation is denied/unavailable, and to
// nothing if there's no coordinate at all.
export default function MissionRouteMap({ destination, origin: fixedOrigin }) {
  const { isLoaded } = useJsApiLoader({
    id: 'jobber-google-maps',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [geoOrigin, setGeoOrigin] = useState(null);
  const [directions, setDirections] = useState(null);
  const [distanceText, setDistanceText] = useState(null);
  const [requested, setRequested] = useState(false);
  const origin = fixedOrigin || geoOrigin;

  useEffect(() => {
    if (fixedOrigin || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeoOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { timeout: 8000 }
    );
  }, [fixedOrigin]);

  const routeOptions = useMemo(() => {
    if (!origin || !destination) return null;
    return { origin, destination, travelMode: 'DRIVING' };
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  if (!GOOGLE_MAPS_API_KEY || !isLoaded || !destination) {
    return <div className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-400">Carte indisponible</div>;
  }

  return (
    <div className="relative">
      <GoogleMap center={destination} zoom={routeOptions ? 8 : 12} mapContainerStyle={{ height: '220px', width: '100%' }} options={MAP_OPTIONS}>
        {!routeOptions && <Marker position={destination} />}
        {routeOptions && !directions && !requested && (
          <DirectionsService
            options={routeOptions}
            callback={(result, status) => {
              setRequested(true);
              if (status === 'OK') {
                setDirections(result);
                setDistanceText(result.routes[0]?.legs?.[0]?.distance?.text || null);
              }
            }}
          />
        )}
        {directions && <DirectionsRenderer options={{ directions, ...ROUTE_OPTIONS }} />}
      </GoogleMap>
      {distanceText && (
        <span className="absolute bottom-3 left-3 rounded-full bg-moss px-3 py-1.5 text-sm font-semibold text-white shadow">
          {distanceText}
        </span>
      )}
    </div>
  );
}
