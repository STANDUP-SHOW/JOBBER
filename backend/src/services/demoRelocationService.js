// Relocates the ~50 seeded "national demo" missions (Mission.isDemoNational,
// see scripts/seedNationalDemoMissions.js) so they always look like they
// were just posted near whoever is actually browsing — for a national
// sales presentation done from any city in France. Each mission gets a
// stable offset derived from its own id and the viewer's own coordinates,
// recomputed on every request rather than stored, so the same 50 missions
// "move" from Grenoble to Marseille depending on who's looking.
const { reverseGeocodeLabel, reverseGeocodeResults } = require('./geocodingService');

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

// `scale` < 1 pulls the point back toward the viewer and `turnDeg` rotates
// its bearing — fallbacks for when the original point lands at sea, abroad
// or in open country.
function demoPositionFor(missionId, viewerLat, viewerLng, scale = 1, turnDeg = 0) {
  const angleDeg = (hashString(`${missionId}-angle`) + turnDeg) % 360;
  const distanceKm = DEMO_RADIUS_KM_MIN + (hashString(`${missionId}-dist`) % (DEMO_RADIUS_KM_MAX - DEMO_RADIUS_KM_MIN));
  return offsetPoint(viewerLat, viewerLng, angleDeg, Math.max(DEMO_RADIUS_KM_MIN, distanceKm * scale));
}

// [scale, turnDeg] tried in order until one snaps to a real street.
const FALLBACK_POSITIONS = [[1, 0], [0.6, 0], [0.3, 0], [0.5, 90], [0.5, 180], [0.5, 270]];

// A raw random point usually lands in a field or on a departmental road, so
// its reverse-geocoded label reads "Route Sans Nom", "D32" or a plus code.
// Only accept a real numbered street in France ("12 Rue Victor Hugo,
// 34500 Béziers"), with a believable house number.
const STREET_TYPE = /^(rue|avenue|av\.|boulevard|bd|place|pl\.|allée|allee|impasse|imp\.|chemin|chem\.|quai|cours|route|rte|square|passage|promenade|montée|faubourg|esplanade|résidence|lotissement|lot\.|hameau|traverse|ruelle|cité|clos|sentier|voie|mail|grande rue|grand'rue|grand rue)\b/i;
const BAD_LABEL = /sans nom|lieu-?dit|\+|^\s*[DN]\s?\d/i;
const MAX_HOUSE_NUMBER = 250;

function pickStreetAddress(results) {
  for (const r of results) {
    const comp = (type) => r.address_components.find((c) => c.types.includes(type));
    const number = parseInt(comp('street_number')?.long_name, 10);
    const route = comp('route')?.long_name;
    if (comp('country')?.short_name !== 'FR' || !route) continue;
    if (!(number >= 1 && number <= MAX_HOUSE_NUMBER)) continue;
    if (BAD_LABEL.test(route) || BAD_LABEL.test(r.formatted_address) || !STREET_TYPE.test(route)) continue;
    // Skip labels led by a shop/building name ("The Tattoo LifeStyle, 65 Bd…").
    if (!/^\d/.test(r.formatted_address)) continue;
    return { address: r.formatted_address, ...r.geometry.location };
  }
  return null;
}

// Snaps a demo point to a real numbered street: first right where it fell,
// then (if that's countryside) a few hundred metres around the centre of the
// nearest town — so missions read like they were posted from a real home.
async function findStreetAddress(lat, lng, seed) {
  const direct = pickStreetAddress(await reverseGeocodeResults(lat, lng, 'street_address'));
  if (direct) return direct;

  const towns = await reverseGeocodeResults(lat, lng, 'locality');
  const town = towns.find((t) => t.address_components.some((c) => c.types.includes('country') && c.short_name === 'FR'));
  if (!town) return null;
  const center = town.geometry.location;
  for (let i = 0; i < 2; i++) {
    const angleDeg = hashString(`${seed}-town-angle-${i}`) % 360;
    const distanceKm = 0.15 + (hashString(`${seed}-town-dist-${i}`) % 400) / 1000;
    const p = offsetPoint(center.lat, center.lng, angleDeg, distanceKm);
    const found = pickStreetAddress(await reverseGeocodeResults(p.lat, p.lng, 'street_address'));
    if (found) return found;
  }
  return null;
}

// Reverse-geocoding the same ~50 points for the same viewer city on every
// page load/every viewer would otherwise hammer the Google API — round the
// cache key to ~1km so nearby lookups share a result. Process-local only;
// fine for a demo (a cold restart just re-fetches on next request).
const labelCache = new Map();

async function relocateForViewer(mission, viewerLat, viewerLng) {
  // Snap the viewer to a ~5km grid so everyone browsing from the same town
  // sees the same 50 addresses (and shares the cache) — the caller still
  // measures distance from the viewer's true position.
  const originLat = Math.round(viewerLat * 20) / 20;
  const originLng = Math.round(viewerLng * 20) / 20;
  const point = demoPositionFor(mission.id, originLat, originLng);
  const cacheKey = `${mission.id}@${originLat},${originLng}`;
  let place = labelCache.get(cacheKey);
  if (place === undefined) {
    place = null;
    for (const [scale, turnDeg] of FALLBACK_POSITIONS) {
      const p = demoPositionFor(mission.id, originLat, originLng, scale, turnDeg);
      place = await findStreetAddress(p.lat, p.lng, mission.id);
      if (place) break;
    }
    if (!place) {
      const label = await reverseGeocodeLabel(point.lat, point.lng);
      place = label ? { address: label, ...point } : null;
    }
    labelCache.set(cacheKey, place);
  }
  if (!place) return { ...mission, ...point };
  return { ...mission, lat: place.lat, lng: place.lng, address: place.address };
}

module.exports = { relocateForViewer, demoPositionFor };
