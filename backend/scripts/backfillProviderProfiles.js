// One-off: creates a ProviderProfile for any existing user that doesn't
// have one yet, now that every account can candidater regardless of role.
// Run once via `node scripts/backfillProviderProfiles.js`.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const usersWithoutProfile = await prisma.user.findMany({
    where: { providerProfile: null },
    select: { id: true },
  });

  for (const user of usersWithoutProfile) {
    await prisma.providerProfile.create({ data: { userId: user.id } });
  }

  console.log(`Créé ${usersWithoutProfile.length} profil(s) prestataire manquant(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
