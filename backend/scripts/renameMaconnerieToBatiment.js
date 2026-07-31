// One-off: renames the "Maçonnerie" category to "Bâtiment" (Maçonnerie
// becomes a sub-category alongside the others, with its own checklist).
// Renaming via .update() keeps the same row id, so existing missions and
// provider skills stay linked. Also re-slugs every child service from
// maconnerie-* to batiment-* so setServiceDetailFields.js keys still match.
// Run once via `node scripts/renameMaconnerieToBatiment.js`.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: 'maconnerie' }, include: { services: true } });
  if (!category) { console.log('Catégorie "maconnerie" introuvable — déjà renommée ?'); return; }

  await prisma.category.update({ where: { id: category.id }, data: { name: 'Bâtiment', slug: 'batiment' } });

  let migrated = 0;
  for (const service of category.services) {
    if (!service.slug.startsWith('maconnerie-')) continue;
    const newSlug = `batiment-${service.slug.slice('maconnerie-'.length)}`;
    await prisma.service.update({ where: { id: service.id }, data: { slug: newSlug } });
    migrated++;
  }

  console.log(`Catégorie renommée en "Bâtiment" (slug: batiment). ${migrated} service(s) re-sluggés.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
