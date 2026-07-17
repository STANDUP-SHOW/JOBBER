const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Google Geocoding API — resolves French addresses reliably (the free
// Nominatim/OSM geocoder previously used here frequently failed or
// mismatched on real French addresses). Uses the same Google Cloud project
// as the frontend's Maps/Places key.
async function geocodeAddress(address) {
  if (!address || !GOOGLE_MAPS_API_KEY) return null;
  try {
    const params = new URLSearchParams({ address, region: 'fr', key: GOOGLE_MAPS_API_KEY });
    const res = await fetch(`${GEOCODE_URL}?${params}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'OK' || !data.results.length) return null;
    const { lat, lng } = data.results[0].geometry.location;
    return { lat, lng };
  } catch (err) {
    return null;
  }
}

// Offsets a coordinate by ~150-300m in a direction derived from the mission id,
// so the public map shows an approximate pin that's stable across requests
// instead of the client's exact address.
function jitterCoordinate(id, lat, lng) {
  if (lat == null || lng == null) return { lat, lng };

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }

  const angle = (hash % 360) * (Math.PI / 180);
  const distanceMeters = 150 + (hash % 150);
  const dLat = (distanceMeters * Math.cos(angle)) / 111320;
  const dLng = (distanceMeters * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));

  return { lat: lat + dLat, lng: lng + dLng };
}

function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { geocodeAddress, jitterCoordinate, haversineDistanceKm };
