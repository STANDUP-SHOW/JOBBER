// One-off: Beauté originally had one Service row per treatment. It's now a
// single "Prestations beauté" service with a multiselect (checkbox) detail
// field covering all treatments, so a mission can bundle several at once.
// Removes the now-superseded per-treatment services. Skips (and reports)
// any service still referenced by a real mission or provider profile
// instead of failing the whole run.
// Run once via `node scripts/removeStaleBeauteServices.js`.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STALE_NAMES = [
  'Épilation du sillon inter-fessier',
  'Manucure',
  'Pose de vernis semi-permanent mains',
  'Épilation Maillot intégral',
  'Épilation des sourcils',
  'Épilation aisselles',
  'Épilation des jambes entières',
  'Vernis des pieds semi-permanent',
  'Épilation 1/2 jambes',
  'Beauté des pieds complète',
  'Épilation homme',
];

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: 'beaute' } });
  if (!category) { console.log('Catégorie beaute introuvable.'); return; }

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
