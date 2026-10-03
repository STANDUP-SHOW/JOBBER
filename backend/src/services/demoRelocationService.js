// Relocates the ~50 seeded "national demo" missions (Mission.isDemoNational,
// see scripts/seedNationalDemoMissions.js) so they always look like they
// were just posted near whoever is actually browsing — for a national
// sales presentation done from any city in France. Each mission gets a
// stable offset derived from its own id and the viewer's own coordinates,
// recomputed on every request rather than stored, so the same 50 missions
// "move" from Grenoble to Marseille depending on who's looking.
const { reverseGeocodeStreet } = require('./geocodingService');

const DEMO_RADIUS_KM_MIN = 2;
const DEMO_RADIUS_KM_MAX = 50;

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash;
}

// Same great-circle offset math as geocodingService.jitterCoordinate, just
// parameterized for a much larger radius around a viewer-supplied origin
// instead of the mission's own address.
function offsetPoint(lat, lng, angleDeg, distanceKm) {
  const distanceMeters = distanceKm * 1000;
  const angle = angleDeg * (Math.PI / 180);
  const dLat = (distanceMeters * Math.cos(angle)) / 111320;
  const dLng = (distanceMeters * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

function demoPositionFor(missionId, viewerLat, viewerLng) {
  const angleDeg = hashString(`${missionId}-angle`) % 360;
  const distanceKm = DEMO_RADIUS_KM_MIN + (hashString(`${missionId}-dist`) % (DEMO_RADIUS_KM_MAX - DEMO_RADIUS_KM_MIN));
  return offsetPoint(viewerLat, viewerLng, angleDeg, distanceKm);
}

// Reverse-geocoding the same ~50 points for the same viewer city on every
// page load/every viewer would otherwise hammer the Google API — round the
// cache key to ~100m so nearby lookups share a result. Process-local only;
// fine for a demo (a cold restart just re-fetches on next request).
const labelCache = new Map();

// A random point 2-50 km away often lands in a field or a vineyard, where
// Google has no named street. Probe a few nearby points (~300 m apart,
// deterministic per mission) and move the mission onto the first one that
// sits on a real street, so the label and the map pin agree.
const STREET_PROBES = [[0, 0], [0, 0.3], [90, 0.3], [180, 0.3], [270, 0.3], [45, 0.8], [225, 0.8]];

async function findStreetNear(missionId, lat, lng) {
  const start = hashString(`${missionId}-probe`) % 360;
  for (const [angle, km] of STREET_PROBES) {
    const point = km ? offsetPoint(lat, lng, start + angle, km) : { lat, lng };
    const cacheKey = `${point.lat.toFixed(3)},${point.lng.toFixed(3)}`;
    let address = labelCache.get(cacheKey);
    if (address === undefined) {
      address = await reverseGeocodeStreet(point.lat, point.lng);
      labelCache.set(cacheKey, address);
    }
    if (address) return { ...point, address };
  }
  return null;
}

async function relocateForViewer(mission, viewerLat, viewerLng) {
  const { lat, lng } = demoPositionFor(mission.id, viewerLat, viewerLng);
  const found = await findStreetNear(mission.id, lat, lng);
  if (found) return { ...mission, lat: found.lat, lng: found.lng, address: found.address };
  return { ...mission, lat, lng };
}

module.exports = { relocateForViewer, demoPositionFor };
