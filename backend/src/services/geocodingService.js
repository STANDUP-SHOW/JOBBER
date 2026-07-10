const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Free OpenStreetMap geocoder. Usage policy requires a descriptive User-Agent
// and caps us at ~1 request/sec, which is fine for mission creation volume.
async function geocodeAddress(address) {
  if (!address) return null;
  try {
    const params = new URLSearchParams({ q: address, format: 'json', limit: '1' });
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'User-Agent': 'Jobber/1.0 (contact@jobbers.be)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const results = await res.json();
    if (!results.length) return null;
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
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

module.exports = { geocodeAddress, jitterCoordinate };
