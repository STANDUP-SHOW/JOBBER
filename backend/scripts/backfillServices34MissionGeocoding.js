// The demo dataset (seedServices34FullDemo.js) set a real street address on
// every mission but skipped geocoding for speed/cost — so those missions
// have no lat/lng, and jobber.city's mission map shows "Carte indisponible"
// for every one of them. Backfills lat/lng from the existing address for
// any mission belonging to the Services 34 agency that's still ungeocoded.
const { PrismaClient } = require('@prisma/client');
const { geocodeAddress } = require('../src/services/geocodingService');
const prisma = new PrismaClient();

const AGENCY_EMAIL = 'agence@services34.fr';

async function main() {
  const agency = await prisma.user.findUnique({ where: { email: AGENCY_EMAIL } });
  if (!agency) throw new Error('Compte agence Services 34 introuvable');

  const missions = await prisma.mission.findMany({
    where: { corporateAgencyId: agency.id, lat: null, address: { not: null } },
    select: { id: true, address: true },
  });

  console.log(`${missions.length} mission(s) à géocoder…`);
  let done = 0;
  for (const mission of missions) {
    const geocoded = await geocodeAddress(mission.address);
    if (!geocoded) {
      console.log(`  ⚠ échec géocodage: ${mission.address}`);
      continue;
    }
    await prisma.mission.update({ where: { id: mission.id }, data: { lat: geocoded.lat, lng: geocoded.lng } });
    done++;
  }
  console.log(`${done}/${missions.length} mission(s) géocodée(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
