// One-off: re-geocodes missions created while the (now-replaced) Nominatim
// geocoder was silently failing on French addresses, leaving lat/lng/
// dropoffLat/dropoffLng null. Run once via `node scripts/backfillMissionGeocoding.js`.
const { PrismaClient } = require('@prisma/client');
const { geocodeAddress } = require('../src/services/geocodingService');
const prisma = new PrismaClient();

const DELAY_MS = 150;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const missions = await prisma.mission.findMany({
    where: {
      OR: [
        { lat: null },
        { AND: [{ dropoffAddress: { not: null } }, { dropoffLat: null }] },
      ],
    },
    select: { id: true, address: true, lat: true, dropoffAddress: true, dropoffLat: true },
  });

  let updated = 0;
  let failed = 0;

  for (const mission of missions) {
    const data = {};

    if (mission.lat == null) {
      const geocoded = await geocodeAddress(mission.address);
      if (geocoded) { data.lat = geocoded.lat; data.lng = geocoded.lng; }
      await sleep(DELAY_MS);
    }

    if (mission.dropoffAddress && mission.dropoffLat == null) {
      const geocoded = await geocodeAddress(mission.dropoffAddress);
      if (geocoded) { data.dropoffLat = geocoded.lat; data.dropoffLng = geocoded.lng; }
      await sleep(DELAY_MS);
    }

    if (Object.keys(data).length > 0) {
      await prisma.mission.update({ where: { id: mission.id }, data });
      updated++;
    } else {
      failed++;
      console.warn(`Échec géocodage mission ${mission.id}: "${mission.address}"`);
    }
  }

  console.log(`${missions.length} mission(s) à traiter — ${updated} mise(s) à jour, ${failed} échec(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
