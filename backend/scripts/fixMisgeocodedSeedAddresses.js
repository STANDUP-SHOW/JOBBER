// One-off fix: two street names used in seedDiverseMissions.js ("Rue de la
// Liberté, Vias" and "Chemin des Vignes, Servian") were too ambiguous for
// Google Geocoding without a postal code — it matched same-named streets
// near Nice and near Carcassonne instead of the intended Béziers-area towns.
// Re-geocodes with the postal code added and patches every mission (address
// or dropoffAddress) using either raw string. Run once via
// `node scripts/fixMisgeocodedSeedAddresses.js`.
const { PrismaClient } = require('@prisma/client');
const { geocodeAddress } = require('../src/services/geocodingService');

const prisma = new PrismaClient();

const FIXES = [
  { needle: 'Rue de la Liberté, Vias', disambiguated: (addr) => addr.replace('Vias', '34450 Vias, France') },
  { needle: 'Chemin des Vignes, Servian', disambiguated: (addr) => addr.replace('Servian', '34290 Servian, France') },
];

async function main() {
  const missions = await prisma.mission.findMany({
    select: { id: true, address: true, dropoffAddress: true },
  });

  let updated = 0;
  for (const mission of missions) {
    const data = {};

    for (const fix of FIXES) {
      if (mission.address?.includes(fix.needle)) {
        const geocoded = await geocodeAddress(fix.disambiguated(mission.address));
        if (geocoded) { data.lat = geocoded.lat; data.lng = geocoded.lng; }
      }
      if (mission.dropoffAddress?.includes(fix.needle)) {
        const geocoded = await geocodeAddress(fix.disambiguated(mission.dropoffAddress));
        if (geocoded) { data.dropoffLat = geocoded.lat; data.dropoffLng = geocoded.lng; }
      }
    }

    if (Object.keys(data).length > 0) {
      await prisma.mission.update({ where: { id: mission.id }, data });
      updated++;
      console.log(`Corrigé : ${mission.id} (${mission.address}${mission.dropoffAddress ? ' -> ' + mission.dropoffAddress : ''})`);
    }
  }

  console.log(`\n${updated} mission(s) corrigée(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
