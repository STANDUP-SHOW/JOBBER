// One-off: the initial Coiffure service names were superseded by a more
// granular list (e.g. "Couleur (racines)" -> "Couleur racines", "Coiffure
// de mariée" -> "Coiffure mariée" + "Coiffure mariée & essai"). Removes the
// old names so the category isn't left with duplicate/stale entries.
// Skips (and reports) any service still referenced by a real mission or
// provider profile instead of failing the whole run.
// Run once via `node scripts/removeStaleCoiffureServices.js`.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STALE_NAMES = [
  'Coupe cheveux courts et mi-longs',
  'Brushing (courts et mi-longs)',
  'Couleur (racines)',
  'Mèches',
  'Balayage',
  'Coiffure de soirée (chignon, tresses, attaches…)',
  'Coiffure de mariée',
];

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: 'coiffure' } });
  if (!category) { console.log('Catégorie coiffure introuvable.'); return; }

  let removed = 0, skipped = 0, missing = 0;
  for (const name of STALE_NAMES) {
    const service = await prisma.service.findFirst({ where: { categoryId: category.id, name } });
    if (!service) { console.log(`Introuvable (déjà supprimé ?) : ${name}`); missing++; continue; }
    try {
      await prisma.service.delete({ where: { id: service.id } });
      removed++;
    } catch (err) {
      console.log(`Conservé (encore référencé par une mission ou un profil) : ${name}`);
      skipped++;
    }
  }
  console.log(`\n${removed} service(s) supprimé(s), ${skipped} conservé(s) (référencés), ${missing} introuvable(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
