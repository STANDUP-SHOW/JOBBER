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

// Turns a lat/lng back into a believable "N° rue, Ville" label — used to
// give a repositioned national-demo mission (see demoRelocationService.js)
// a real-looking address instead of raw coordinates or its original seeded
// city once it's been moved near the viewer.
async function reverseGeocodeLabel(lat, lng) {
  if (!GOOGLE_MAPS_API_KEY) return null;
  try {
    const params = new URLSearchParams({ latlng: `${lat},${lng}`, region: 'fr', key: GOOGLE_MAPS_API_KEY });
    const res = await fetch(`${GEOCODE_URL}?${params}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'OK' || !data.results.length) return null;
    const best = data.results.find((r) => r.types.includes('street_address') || r.types.includes('route')) || data.results[0];
    return best.formatted_address;
  } catch (err) {
    return null;
  }
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

// Reverse-geocodes to a real street near the point, as "Rue X, 34500 Ville"
// (never a house number, never a plus code or "Unnamed Road"). Returns null
// when Google has no named street there (fields, forest, sea).
async function reverseGeocodeStreet(lat, lng) {
  if (!GOOGLE_MAPS_API_KEY) return null;
  try {
    const params = new URLSearchParams({
      latlng: `${lat},${lng}`, region: 'fr', language: 'fr',
      result_type: 'street_address|route', key: GOOGLE_MAPS_API_KEY,
    });
    const res = await fetch(`${GEOCODE_URL}?${params}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'OK') return null;
    for (const result of data.results) {
      const component = (type) => result.address_components.find((c) => c.types.includes(type))?.long_name;
      const route = component('route');
      const city = component('locality') || component('postal_town') || component('administrative_area_level_2');
      if (!route || !city || /unnamed|sans nom/i.test(route)) continue;
      const postalCode = component('postal_code');
      return `${route}, ${postalCode ? `${postalCode} ` : ''}${city}`;
    }
    return null;
  } catch (err) {
    return null;
  }
}

// What anyone but the mission's own client sees of an open mission's
// address: the street, postal code and city, without the house number
// (e.g. "12 bis Rue Victor Hugo, 34500 Béziers, France" → "Rue Victor Hugo,
// 34500 Béziers"). Same idea as jitterCoordinate for the map pin.
function publicAddress(address) {
  if (!address) return address;
  const parts = address.split(',').map((p) => p.trim()).filter((p) => p && p.toLowerCase() !== 'france');
  if (!parts.length) return address;
  // A house number is 1-4 digits (+ bis/ter/A…) followed by the street
  // name; a leading 5-digit token is a postal code and stays.
  parts[0] = parts[0].replace(/^\d{1,4}\s*(bis|ter|quater|[a-d](?=\s))?\s+(?=\D)/i, '');
  return parts.filter(Boolean).join(', ');
}

module.exports = { geocodeAddress, reverseGeocodeLabel, reverseGeocodeStreet, publicAddress, jitterCoordinate, haversineDistanceKm };
