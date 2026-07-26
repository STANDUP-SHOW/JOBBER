// One-off migration: Bricolage's equipment list had a single combined
// "Escabeau / échelle" item; the user wants Échelle and Escabeau as two
// separate items (so each can be required independently), on both
// Bricolage and Jardinage. Renames the existing combined row to "Escabeau"
// (keeps its id, so any mission that already required it keeps that
// requirement) and adds "Échelle" fresh; Jardinage gets both fresh since
// it had neither before.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureEquipment(categoryId, name) {
  return prisma.equipment.upsert({
    where: { categoryId_name: { categoryId, name } },
    update: {},
    create: { name, categoryId },
  });
}

async function main() {
  const bricolage = await prisma.category.findUnique({ where: { slug: 'bricolage' } });
  const jardinage = await prisma.category.findUnique({ where: { slug: 'jardinage' } });
  if (!bricolage || !jardinage) throw new Error('Catégorie bricolage ou jardinage introuvable');

  const combined = await prisma.equipment.findUnique({
    where: { categoryId_name: { categoryId: bricolage.id, name: 'Escabeau / échelle' } },
  });
  if (combined) {
    await prisma.equipment.update({ where: { id: combined.id }, data: { name: 'Escabeau' } });
    console.log('Bricolage: "Escabeau / échelle" renommé en "Escabeau" (id conservé).');
  } else {
    await ensureEquipment(bricolage.id, 'Escabeau');
    console.log('Bricolage: "Escabeau" créé.');
  }
  await ensureEquipment(bricolage.id, 'Échelle');
  console.log('Bricolage: "Échelle" créé.');

  await ensureEquipment(jardinage.id, 'Escabeau');
  await ensureEquipment(jardinage.id, 'Échelle');
  console.log('Jardinage: "Escabeau" et "Échelle" créés.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
