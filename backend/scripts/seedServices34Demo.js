// One-off demo: creates a full test chain for the Services 34 corporate
// pipeline — 5 mission requests attributed to the Services 34 agency
// (as if submitted via services34.fr and already "Publié sur Jobber"),
// plus 5 test jobber accounts, one per category, each submitting a
// realistic offer on the matching mission. Everything then shows up in
// the Services 34 admin panel under "Offres Jobber", ready to validate.
// Test-only data, clearly marked with @services34-demo.local emails.
// Safe to re-run: upserts by email/slug, never duplicates.
// Run once via `node scripts/seedServices34Demo.js`.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');
const { geocodeAddress } = require('../src/services/geocodingService');
const { generateCorporateCode } = require('../src/utils/agency');

const AGENCY_EMAIL = 'agence@services34.fr';
const DEMO_PASSWORD = 'Demo1234!';

function daysFromNow(n, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const CLIENTS = [
  { email: 'client1@services34-demo.local', firstName: 'Isabelle', lastName: 'Fabre', phone: '0611223344' },
  { email: 'client2@services34-demo.local', firstName: 'Marc', lastName: 'Delmas', phone: '0622334455' },
  { email: 'client3@services34-demo.local', firstName: 'Sophie', lastName: 'Roux', phone: '0633445566' },
  { email: 'client4@services34-demo.local', firstName: 'Alain', lastName: 'Vidal', phone: '0644556677' },
  { email: 'client5@services34-demo.local', firstName: 'Nathalie', lastName: 'Guiraud', phone: '0655667788' },
];

const JOBBERS = [
  { email: 'jobber-bricolage@services34-demo.local', firstName: 'Julien', lastName: 'Martin', categorySlug: 'bricolage', hourlyRate: 22 },
  { email: 'jobber-jardinage@services34-demo.local', firstName: 'Karim', lastName: 'Belkacem', categorySlug: 'jardinage', hourlyRate: 20 },
  { email: 'jobber-menage@services34-demo.local', firstName: 'Nadia', lastName: 'Costa', categorySlug: 'menage', hourlyRate: 18 },
  { email: 'jobber-piscine@services34-demo.local', firstName: 'Thomas', lastName: 'Simon', categorySlug: 'piscine', hourlyRate: 25 },
  { email: 'jobber-conciergerie@services34-demo.local', firstName: 'Sophie', lastName: 'Laurent', categorySlug: 'conciergerie', hourlyRate: 19 },
];

const MISSIONS = [
  {
    clientEmail: 'client1@services34-demo.local', categorySlug: 'bricolage', jobberEmail: 'jobber-bricolage@services34-demo.local',
    title: 'Montage bibliothèque et fixation d\'étagères', description: 'Montage d\'une bibliothèque livrée en kit et fixation de 4 étagères murales dans le salon.',
    address: '8 Avenue Jean Jaurès, Béziers', estimatedHours: 3, offerHourlyRate: 22,
  },
  {
    clientEmail: 'client2@services34-demo.local', categorySlug: 'jardinage', jobberEmail: 'jobber-jardinage@services34-demo.local',
    title: 'Débroussaillage et taille de haie', description: 'Débroussaillage d\'un terrain de 400 m² et taille d\'une haie de lauriers en bordure de propriété.',
    address: '15 Chemin des Oliviers, Vias', estimatedHours: 4, offerHourlyRate: 20,
  },
  {
    clientEmail: 'client3@services34-demo.local', categorySlug: 'menage', jobberEmail: 'jobber-menage@services34-demo.local',
    title: 'Ménage de printemps avant réception', description: 'Grand ménage d\'une maison de 100 m² avant l\'arrivée d\'invités : vitres, sols, cuisine, salles de bain.',
    address: '22 Rue de la République, Agde', estimatedHours: 5, offerHourlyRate: 18,
  },
  {
    clientEmail: 'client4@services34-demo.local', categorySlug: 'piscine', jobberEmail: 'jobber-piscine@services34-demo.local',
    title: 'Remise en état de la piscine avant l\'été', description: 'Nettoyage complet du bassin, contrôle des équipements et rééquilibrage chimique de l\'eau après l\'hiver.',
    address: '5 Impasse des Pins, Marseillan', estimatedHours: 3, offerHourlyRate: 25,
  },
  {
    clientEmail: 'client5@services34-demo.local', categorySlug: 'conciergerie', jobberEmail: 'jobber-conciergerie@services34-demo.local',
    title: 'Surveillance de résidence secondaire pendant l\'été', description: 'Passages hebdomadaires pour vérifier la résidence pendant notre absence de juillet à septembre.',
    address: '3 Rue du Port, Béziers', estimatedHours: 2, offerHourlyRate: 19,
  },
];

async function main() {
  const agency = await prisma.user.findUnique({ where: { email: AGENCY_EMAIL } });
  if (!agency) throw new Error('Compte agence Services 34 introuvable — lancez d\'abord scripts/setupServices34Agency.js');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const c of CLIENTS) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { email: c.email, passwordHash, firstName: c.firstName, lastName: c.lastName, phone: c.phone, isEmailVerified: true },
    });
  }
  console.log(`${CLIENTS.length} compte(s) client démo prêt(s).`);

  for (const j of JOBBERS) {
    const category = await prisma.category.findUnique({ where: { slug: j.categorySlug } });
    if (!category) { console.log(`Catégorie introuvable : ${j.categorySlug}, jobber ignoré`); continue; }

    const jobber = await prisma.user.upsert({
      where: { email: j.email },
      update: {},
      create: { email: j.email, passwordHash, firstName: j.firstName, lastName: j.lastName, isEmailVerified: true },
    });

    const profile = await prisma.providerProfile.upsert({
      where: { userId: jobber.id },
      update: {},
      create: { userId: jobber.id, verificationStatus: 'APPROVED' },
    });

    await prisma.providerCategory.upsert({
      where: { providerId_categoryId: { providerId: profile.id, categoryId: category.id } },
      update: {},
      create: { providerId: profile.id, categoryId: category.id, level: 'PROFESSIONNEL', hourlyRate: j.hourlyRate },
    });
  }
  console.log(`${JOBBERS.length} profil(s) jobber démo prêt(s) (mot de passe : ${DEMO_PASSWORD}).`);

  let created = 0;
  for (const [i, m] of MISSIONS.entries()) {
    const client = await prisma.user.findUnique({ where: { email: m.clientEmail } });
    const category = await prisma.category.findUnique({ where: { slug: m.categorySlug } });
    const jobber = await prisma.user.findUnique({ where: { email: m.jobberEmail } });
    if (!client || !category || !jobber) { console.log(`Données manquantes pour la mission "${m.title}", ignorée`); continue; }

    const existing = await prisma.mission.findFirst({ where: { title: m.title, corporateAgencyId: agency.id } });
    if (existing) { console.log(`Mission déjà créée : ${m.title} (${existing.corporateCode})`); continue; }

    const geocoded = await geocodeAddress(m.address).catch(() => null);

    const mission = await prisma.mission.create({
      data: {
        categoryId: category.id,
        title: m.title,
        description: m.description,
        address: m.address,
        lat: geocoded?.lat,
        lng: geocoded?.lng,
        desiredDate: daysFromNow(3 + i, 9, 0),
        estimatedHours: m.estimatedHours,
        clientId: client.id,
        corporateAgencyId: agency.id,
        corporateCode: generateCorporateCode(category.slug),
        visibility: 'PUBLIC', // already "Publié sur Jobber"
      },
    });

    await prisma.offer.create({
      data: { missionId: mission.id, providerId: jobber.id, hourlyRate: m.offerHourlyRate, message: 'Disponible rapidement, matériel professionnel fourni.' },
    });

    console.log(`Mission créée : ${mission.title} — code ${mission.corporateCode} — offre de ${m.jobberEmail}`);
    created++;
  }

  console.log(`\n${created} mission(s) + offre(s) créée(s). Va voir "Offres Jobber" dans /admin.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
