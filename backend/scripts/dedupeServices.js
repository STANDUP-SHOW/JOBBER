// One-off cleanup: an earlier ad-hoc use of the admin "add service" endpoint
// created duplicate Service rows (same categoryId + name, different slug —
// one with a clean seed-generated slug, one with a categoryId+timestamp
// slug). This merges each duplicate pair into the clean-slug row, moving
// any Mission/ProviderService references before deleting the messy row.
// Safe to re-run: no-ops once no duplicates remain.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany();
  const groups = {};
  for (const s of services) {
    const key = `${s.categoryId}::${s.name}`;
    (groups[key] = groups[key] || []).push(s);
  }

  let mergedGroups = 0;
  let deletedRows = 0;

  for (const [key, rows] of Object.entries(groups)) {
    if (rows.length < 2) continue;

    // Prefer the row whose slug looks like the deterministic seed slug
    // (categorySlug-name, no embedded cuid) over any messier variant.
    const clean = rows.find((r) => !/^c[a-z0-9]{20,}/.test(r.slug)) || rows[0];
    const dupes = rows.filter((r) => r.id !== clean.id);

    console.log(`Fusion "${key}" -> garde ${clean.slug}, supprime ${dupes.map((d) => d.slug).join(', ')}`);

    for (const dupe of dupes) {
      await prisma.mission.updateMany({ where: { serviceId: dupe.id }, data: { serviceId: clean.id } });

      const providerLinks = await prisma.providerService.findMany({ where: { serviceId: dupe.id } });
      for (const link of providerLinks) {
        const existing = await prisma.providerService.findUnique({
          where: { providerId_serviceId: { providerId: link.providerId, serviceId: clean.id } },
        });
        if (existing) {
          await prisma.providerService.delete({ where: { id: link.id } });
        } else {
          await prisma.providerService.update({ where: { id: link.id }, data: { serviceId: clean.id } });
        }
      }

      await prisma.service.delete({ where: { id: dupe.id } });
      deletedRows++;
    }
    mergedGroups++;
  }

  console.log(`Terminé : ${mergedGroups} groupes fusionnés, ${deletedRows} doublons supprimés.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
