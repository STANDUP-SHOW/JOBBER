const DISTANCE_MATRIX_URL = 'https://maps.googleapis.com/maps/api/distancematrix/json';
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Fixed origin for every "Mission Agence" travel-fee calculation — the
// agency always dispatches from this address, never from the assigned
// agent's own location. Labelled "Départ agence" in the admin UI.
const AGENCY_DEPARTURE_ADDRESS = '2 Rue Julien Imbert, 34500 Béziers, France';

// One-way driving distance in km, via the same Google Cloud project as the
// frontend's Maps/Places key and the backend's geocoding service.
async function getOneWayDistanceKm(destinationAddress) {
  if (!destinationAddress || !GOOGLE_MAPS_API_KEY) return null;
  try {
    const params = new URLSearchParams({
      origins: AGENCY_DEPARTURE_ADDRESS,
      destinations: destinationAddress,
      units: 'metric',
      region: 'fr',
      key: GOOGLE_MAPS_API_KEY,
    });
    const res = await fetch(`${DISTANCE_MATRIX_URL}?${params}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const element = data.rows?.[0]?.elements?.[0];
    if (data.status !== 'OK' || !element || element.status !== 'OK') return null;
    return element.distance.value / 1000;
  } catch (err) {
    return null;
  }
}

module.exports = { getOneWayDistanceKm, AGENCY_DEPARTURE_ADDRESS };
