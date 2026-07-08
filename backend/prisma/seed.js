const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Ménage', slug: 'menage', icon: '🧹', services: ['Ménage à domicile', 'Repassage', 'Nettoyage de vitres', "Aide au rangement"] },
  { name: 'Bricolage', slug: 'bricolage', icon: '🔧', services: ['Petites réparations', 'Montage de meubles', 'Pose d\'étagères', 'Peinture intérieure'] },
  { name: 'Déménagement', slug: 'demenagement', icon: '📦', services: ["Aide au déménagement", 'Déplacer un meuble', 'Emballage de cartons'] },
  { name: 'Jardinage', slug: 'jardinage', icon: '🌱', services: ['Tonte de pelouse', 'Taille de haie', 'Entretien de jardin'] },
  { name: "Garde d'enfants", slug: 'garde-enfants', icon: '🧒', services: ['Baby-sitting', 'Sortie d\'école', 'Aide aux devoirs'] },
  { name: 'Cours particuliers', slug: 'cours-particuliers', icon: '📚', services: ['Soutien scolaire', "Cours d'informatique", 'Cours de langues'] },
  { name: 'Aide à la personne', slug: 'aide-personne', icon: '🤝', services: ['Accompagnement courses', 'Accompagnement rendez-vous médicaux', 'Préparation de repas'] },
  { name: "Garde d'animaux", slug: 'garde-animaux', icon: '🐾', services: ['Promenade de chien', 'Pet-sitting'] },
  { name: 'Informatique', slug: 'informatique', icon: '💻', services: ["Installation d'imprimante", "Nettoyage d'ordinateur", 'Installation de box'] },
];

async function main() {
  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { name: cat.name, slug: cat.slug, icon: cat.icon },
    });

    for (const serviceName of cat.services) {
      const slug = `${cat.slug}-${serviceName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}`;
      await prisma.service.upsert({
        where: { slug },
        update: {},
        create: { name: serviceName, slug, categoryId: category.id },
      });
    }
  }

  const adminEmail = 'admin@jobber.local';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash('ChangeMe123!', 10),
        firstName: 'Admin',
        lastName: 'Jobber',
        role: 'ADMIN',
      },
    });
  }

  console.log('Seed terminé: catégories, services et compte admin créés.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
