// One-off: fills every section of the Services 34 admin panel with
// realistic demo data, as if the agency had been running for several
// weeks — for product demos/presentations. All test accounts use
// @services34-demo.local emails. Geocoding is skipped (lat/lng left null)
// to keep this fast; none of the admin list views need it yet.
// Safe to re-run: skips any mission whose title+category already exists.
// Run once via `node scripts/seedServices34FullDemo.js`.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
const { generateCorporateCode } = require('../src/utils/agency');

const AGENCY_EMAIL = 'agence@services34.fr';
const DEMO_PASSWORD = 'Demo1234!';

function daysAgo(n, hour = 9) { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(hour, 0, 0, 0); return d; }
function daysFromNow(n, hour = 9) { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(hour, 0, 0, 0); return d; }
function round2(n) { return Math.round(n * 100) / 100; }

const ADDRESSES = [
  '8 Avenue Jean Jaurès, Béziers', '15 Chemin des Oliviers, Vias', '22 Rue de la République, Agde',
  '5 Impasse des Pins, Marseillan', '3 Rue du Port, Béziers', '11 Chemin des Vignes, Servian',
  '4 Rue des Oliviers, Bédarieux', '13 Rue du Château, Pézenas', '9 Rue de la Fontaine, Agde',
  '17 Avenue de la Gare, Sérignan', '2 Rue Nationale, Valras-Plage', '6 Rue Boieldieu, Béziers',
  '20 Avenue Georges Clemenceau, Agde', '14 Rue de la Citadelle, Béziers', '19 Avenue de la Plage, Portiragnes',
  '1 Rue Nationale, Sérignan', '7 Rue des Écoles, Vias', '10 Rue Victor Hugo, Béziers',
  '16 Rue Victor Hugo, Bédarieux', '12 Rue de la Fontaine, Sérignan', '21 Rue de la Liberté, Vias',
  '18 Rue des Muriers, Pézenas', '9 Rue Paul Riquet, Béziers', '5 Rue de la République, Villeneuve-lès-Béziers',
  '3 Rue des Jardins, Villeneuve-lès-Béziers',
];

const CLIENT_NAMES = [
  ['Isabelle', 'Fabre'], ['Marc', 'Delmas'], ['Sophie', 'Roux'], ['Alain', 'Vidal'], ['Nathalie', 'Guiraud'],
  ['Philippe', 'Andréu'], ['Christine', 'Bousquet'], ['Laurent', 'Cros'], ['Valérie', 'Fages'], ['Éric', 'Gély'],
  ['Sandrine', 'Hébrard'], ['Pascal', 'Icard'], ['Céline', 'Jalabert'], ['Didier', 'Ladet'], ['Aurélie', 'Malet'],
  ['Bruno', 'Nègre'], ['Émilie', 'Oustry'], ['Serge', 'Pagès'], ['Delphine', 'Quintard'], ['Fabrice', 'Ricard'],
  ['Stéphanie', 'Serres'], ['Thierry', 'Teisseire'], ['Virginie', 'Usson'], ['Vincent', 'Valette'], ['Karine', 'Wable'],
];

const JOBBER_NAMES = [
  ['Julien', 'Martin'], ['Antoine', 'Fournier'], ['Rémi', 'Blanc'], ['Damien', 'Girard'],
  ['Karim', 'Belkacem'], ['Yanis', 'Ferreira'], ['Louis', 'Rousseau'], ['Hugo', 'Petit'],
  ['Nadia', 'Costa'], ['Camille', 'Leroy'], ['Manon', 'Dupuis'], ['Léa', 'Morel'],
  ['Thomas', 'Simon'], ['Maxime', 'Robin'], ['Kevin', 'Fontaine'], ['Nicolas', 'Bertrand'],
  ['Sophie', 'Laurent'], ['Claire', 'Michel'], ['Julie', 'Garnier'], ['Amandine', 'Roy'],
];

const CATEGORY_TASKS = {
  bricolage: [
    ['Montage de meubles de salon', "Montage d'un ensemble de meubles livrés en kit, notice fournie."],
    ["Fixation d'étagères murales", "Pose de 4 étagères dans un salon, perçage béton."],
    ['Pose de papier peint', "Pose de papier peint dans une chambre de 12 m²."],
    ['Petites réparations diverses', "Réparation d'une porte de placard et fixation d'une poignée."],
    ["Peinture intérieure d'une chambre", "Peinture d'une chambre de 15 m², deux couches."],
    ["Remplacement d'une porte intérieure", "Dépose et pose d'une nouvelle porte avec huisserie."],
  ],
  jardinage: [
    ['Tonte de pelouse et taille de haie', "Tonte d'un jardin de 300 m² et taille d'une haie de lauriers."],
    ['Débroussaillage de terrain', "Débroussaillage d'un terrain de 500 m² en zone à risque incendie."],
    ['Entretien du jardin mensuel', "Entretien régulier : tonte, désherbage, taille légère."],
    ['Désherbage des massifs', "Désherbage manuel de plusieurs massifs de fleurs."],
    ['Taille des arbres fruitiers', "Taille de 6 arbres fruitiers avant la période de floraison."],
    ["Aménagement d'un jardin méditerranéen", "Plantation d'essences méditerranéennes peu gourmandes en eau."],
  ],
  menage: [
    ['Ménage à domicile hebdomadaire', "Ménage régulier d'un T3 : sols, sanitaires, cuisine."],
    ['Grand ménage de printemps', "Nettoyage en profondeur d'une maison : vitres, placards, four."],
    ['Ménage de fin de bail', "Nettoyage complet avant restitution des clés."],
    ['Ménage de location saisonnière', "Ménage entre deux locations, linge compris."],
    ['Nettoyage de vitres', "Nettoyage de toutes les vitres d'un appartement, intérieur et extérieur."],
    ['Repassage et entretien du linge', "Repassage d'un volume important de linge courant."],
  ],
  piscine: [
    ['Entretien régulier de la piscine', "Passage hebdomadaire : nettoyage, contrôle et équilibrage de l'eau."],
    ["Remise en état après l'hiver", "Nettoyage complet et rééquilibrage chimique avant la saison."],
    ['Nettoyage du bassin et des skimmers', "Nettoyage des parois, du fond et vidage des paniers de skimmers."],
    ['Contrôle du robot de piscine', "Vérification et nettoyage des filtres du robot."],
    ["Traitement de l'eau verte", "Traitement choc et filtration prolongée pour une eau trouble."],
  ],
  conciergerie: [
    ['Surveillance de résidence secondaire', "Passages réguliers pour vérifier la résidence en l'absence des propriétaires."],
    ['Accueil de voyageurs Airbnb', "Accueil, remise des clés et présentation du logement."],
    ['Gestion complète de location saisonnière', "Formule clé en main : entretien, accueil, gestion de l'annonce."],
    ["État des lieux d'entrée et de sortie", "État des lieux détaillé avec compte-rendu photographique."],
    ['Buanderie-Pressing entre deux locations', "Collecte, pressing et remplacement du linge de maison."],
  ],
};

const CATEGORY_SLUGS = ['bricolage', 'jardinage', 'menage', 'piscine', 'conciergerie'];

let addrIdx = 0, clientIdx = 0;
function nextAddress() { return ADDRESSES[addrIdx++ % ADDRESSES.length]; }
function nextClient() { return CLIENT_NAMES[clientIdx++ % CLIENT_NAMES.length]; }
function taskFor(slug, i) { const pool = CATEGORY_TASKS[slug]; return pool[i % pool.length]; }

async function ensureClient(email, firstName, lastName, passwordHash) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, firstName, lastName, isEmailVerified: true },
  });
}

async function ensureJobber(email, firstName, lastName, categoryId, hourlyRate, passwordHash) {
  const jobber = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, firstName, lastName, isEmailVerified: true },
  });
  const profile = await prisma.providerProfile.upsert({
    where: { userId: jobber.id },
    update: {},
    create: { userId: jobber.id, verificationStatus: 'APPROVED', ratingAverage: 4.5, ratingCount: 12, completedMissions: 12 },
  });
  await prisma.providerCategory.upsert({
    where: { providerId_categoryId: { providerId: profile.id, categoryId } },
    update: {},
    create: { providerId: profile.id, categoryId, level: 'PROFESSIONNEL', hourlyRate },
  });
  return jobber;
}

async function missionExists(title, agencyId) {
  return prisma.mission.findFirst({ where: { title, corporateAgencyId: agencyId } });
}

async function main() {
  const agency = await prisma.user.findUnique({ where: { email: AGENCY_EMAIL } });
  if (!agency) throw new Error("Compte agence introuvable — lancez d'abord scripts/setupServices34Agency.js");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const categories = {};
  for (const slug of CATEGORY_SLUGS) {
    categories[slug] = await prisma.category.findUnique({ where: { slug } });
    if (!categories[slug]) throw new Error(`Catégorie manquante : ${slug}`);
  }

  // 25 test clients
  for (let i = 0; i < CLIENT_NAMES.length; i++) {
    const [firstName, lastName] = CLIENT_NAMES[i];
    await ensureClient(`client-demo${i + 1}@services34-demo.local`, firstName, lastName, passwordHash);
  }
  console.log(`${CLIENT_NAMES.length} clients démo prêts.`);

  // 20 jobbers (4 per category), all added as employees
  const jobbersBySlug = {};
  let nameIdx = 0;
  for (const slug of CATEGORY_SLUGS) {
    jobbersBySlug[slug] = [];
    for (let i = 0; i < 4; i++) {
      const [firstName, lastName] = JOBBER_NAMES[nameIdx];
      const email = `jobber-${slug}-${i + 1}@services34-demo.local`;
      const rate = 16 + Math.floor(Math.random() * 12);
      const jobber = await ensureJobber(email, firstName, lastName, categories[slug].id, rate, passwordHash);
      jobbersBySlug[slug].push(jobber);
      await prisma.agencyEmployee.upsert({
        where: { agencyId_jobberId: { agencyId: agency.id, jobberId: jobber.id } },
        update: {},
        create: { agencyId: agency.id, jobberId: jobber.id },
      });
      nameIdx++;
    }
  }
  console.log('20 jobbers démo créés et ajoutés comme employés.');

  let clientCursor = 0;
  async function nextClientUser() {
    const email = `client-demo${(clientCursor % CLIENT_NAMES.length) + 1}@services34-demo.local`;
    clientCursor++;
    return prisma.user.findUnique({ where: { email } });
  }

  // --- Stage 1: 20 demandes reçues (PRIVATE, OPEN, no offer) ---
  let count = 0;
  for (const slug of CATEGORY_SLUGS) {
    for (let i = 0; i < 4; i++) {
      const [title, description] = taskFor(slug, i);
      const fullTitle = `${title} #${count + 1}`;
      if (await missionExists(fullTitle, agency.id)) { count++; continue; }
      const client = await nextClientUser();
      await prisma.mission.create({
        data: {
          categoryId: categories[slug].id, title: fullTitle, description, address: nextAddress(),
          desiredDate: daysFromNow(2 + count), estimatedHours: 2 + (count % 4),
          clientId: client.id, corporateAgencyId: agency.id, corporateCode: generateCorporateCode(slug),
          visibility: 'PRIVATE',
        },
      });
      count++;
    }
  }
  console.log(`${count} demande(s) reçue(s) créée(s).`);

  // --- Stage 2: 20 publiées sur Jobber avec une offre en attente ---
  count = 0;
  for (const slug of CATEGORY_SLUGS) {
    for (let i = 0; i < 4; i++) {
      const [title, description] = taskFor(slug, i + 1);
      const fullTitle = `${title} — pub #${count + 1}`;
      if (await missionExists(fullTitle, agency.id)) { count++; continue; }
      const client = await nextClientUser();
      const jobber = jobbersBySlug[slug][count % 4];
      const mission = await prisma.mission.create({
        data: {
          categoryId: categories[slug].id, title: fullTitle, description, address: nextAddress(),
          desiredDate: daysFromNow(3 + count), estimatedHours: 2 + (count % 4),
          clientId: client.id, corporateAgencyId: agency.id, corporateCode: generateCorporateCode(slug),
          visibility: 'PUBLIC',
        },
      });
      const rate = 16 + Math.floor(Math.random() * 12);
      await prisma.offer.create({ data: { missionId: mission.id, providerId: jobber.id, hourlyRate: rate } });
      count++;
    }
  }
  console.log(`${count} mission(s) publiée(s) sur Jobber avec offre en attente.`);

  // --- Stage 3: 20 missions Jobber en cours (Booking + Payment HELD_IN_ESCROW) ---
  count = 0;
  const jobberMissionAmounts = [];
  for (const slug of CATEGORY_SLUGS) {
    for (let i = 0; i < 4; i++) {
      const [title, description] = taskFor(slug, i + 2);
      const fullTitle = `${title} — en cours #${count + 1}`;
      if (await missionExists(fullTitle, agency.id)) { count++; continue; }
      const client = await nextClientUser();
      const jobber = jobbersBySlug[slug][count % 4];
      const hours = 2 + (count % 4);
      const rate = 16 + Math.floor(Math.random() * 12);
      const mission = await prisma.mission.create({
        data: {
          categoryId: categories[slug].id, title: fullTitle, description, address: nextAddress(),
          desiredDate: daysFromNow(1 + (count % 5)), estimatedHours: hours,
          clientId: client.id, corporateAgencyId: agency.id, corporateCode: generateCorporateCode(slug),
          visibility: 'PUBLIC', status: 'ASSIGNED',
        },
      });
      const offer = await prisma.offer.create({ data: { missionId: mission.id, providerId: jobber.id, hourlyRate: rate, status: 'ACCEPTED' } });
      const totalAmount = round2(hours * rate);
      await prisma.booking.create({
        data: {
          missionId: mission.id, offerId: offer.id, clientId: agency.id, providerId: jobber.id,
          scheduledDate: mission.desiredDate, hours, hourlyRate: rate, totalAmount, status: 'SCHEDULED',
          payment: { create: { amount: round2(totalAmount + 10), platformFee: 10, managerFee: 10, providerFee: 0, providerPayout: totalAmount, status: 'HELD_IN_ESCROW' } },
        },
      });
      count++;
    }
  }
  console.log(`${count} mission(s) Jobber en cours créée(s).`);

  // --- Stage 4: 20 missions Jobber terminées + facture par mission + 1 facture mensuelle juillet ---
  count = 0;
  for (const slug of CATEGORY_SLUGS) {
    for (let i = 0; i < 4; i++) {
      const [title, description] = taskFor(slug, i + 3);
      const fullTitle = `${title} — terminée #${count + 1}`;
      if (await missionExists(fullTitle, agency.id)) { count++; continue; }
      const client = await nextClientUser();
      const jobber = jobbersBySlug[slug][count % 4];
      const hours = 2 + (count % 4);
      const rate = 16 + Math.floor(Math.random() * 12);
      const corporateCode = generateCorporateCode(slug);
      const mission = await prisma.mission.create({
        data: {
          categoryId: categories[slug].id, title: fullTitle, description, address: nextAddress(),
          desiredDate: daysAgo(3 + count), estimatedHours: hours,
          clientId: client.id, corporateAgencyId: agency.id, corporateCode,
          visibility: 'PUBLIC', status: 'COMPLETED',
        },
      });
      const offer = await prisma.offer.create({ data: { missionId: mission.id, providerId: jobber.id, hourlyRate: rate, status: 'ACCEPTED' } });
      const totalAmount = round2(hours * rate);
      const amount = round2(totalAmount + 10);
      await prisma.booking.create({
        data: {
          missionId: mission.id, offerId: offer.id, clientId: agency.id, providerId: jobber.id,
          scheduledDate: mission.desiredDate, hours, hourlyRate: rate, totalAmount, status: 'COMPLETED',
          payment: { create: { amount, platformFee: 10, managerFee: 10, providerFee: 0, providerPayout: totalAmount, status: 'RELEASED', paidAt: mission.desiredDate, releasedAt: mission.desiredDate } },
        },
      });
      jobberMissionAmounts.push(amount);
      await prisma.invoice.upsert({
        where: { reference: `${corporateCode}-JOBBER` },
        update: {},
        create: { agencyId: agency.id, kind: 'JOBBER_MISSION', reference: `${corporateCode}-JOBBER`, missionId: mission.id, amount },
      });
      count++;
    }
  }
  console.log(`${count} mission(s) Jobber terminée(s) + facture(s) créée(s).`);

  const julyRef = '2026-07-jobber';
  const julyTotal = round2(jobberMissionAmounts.reduce((s, a) => s + a, 0));
  await prisma.invoice.upsert({
    where: { reference: julyRef },
    update: { amount: julyTotal },
    create: { agencyId: agency.id, kind: 'JOBBER_MONTHLY', reference: julyRef, periodYear: 2026, periodMonth: 7, amount: julyTotal },
  });
  console.log(`Facture mensuelle Jobber juillet 2026 : ${julyRef} (${julyTotal} €).`);

  // --- Stages 5 & 6: 20 missions Agence en cours + 20 terminées (agence = provider, client réel paie) ---
  count = 0;
  for (const slug of CATEGORY_SLUGS) {
    for (let i = 0; i < 4; i++) {
      const [title, description] = taskFor(slug, i + 4);
      const fullTitle = `${title} — agence en cours #${count + 1}`;
      if (await missionExists(fullTitle, agency.id)) { count++; continue; }
      const client = await nextClientUser();
      const hours = 2 + (count % 4);
      const rate = 20 + (count % 6);
      const mission = await prisma.mission.create({
        data: {
          categoryId: categories[slug].id, title: fullTitle, description, address: nextAddress(),
          desiredDate: daysFromNow(1 + (count % 5)), estimatedHours: hours,
          clientId: client.id, corporateAgencyId: agency.id, corporateCode: generateCorporateCode(slug),
          visibility: 'PRIVATE', status: 'ASSIGNED',
        },
      });
      const offer = await prisma.offer.create({ data: { missionId: mission.id, providerId: agency.id, hourlyRate: rate, status: 'ACCEPTED' } });
      const totalAmount = round2(hours * rate);
      await prisma.booking.create({
        data: {
          missionId: mission.id, offerId: offer.id, clientId: client.id, providerId: agency.id,
          scheduledDate: mission.desiredDate, hours, hourlyRate: rate, totalAmount, status: 'SCHEDULED',
          payment: { create: { amount: totalAmount, platformFee: 0, managerFee: 0, providerFee: 0, providerPayout: totalAmount, status: 'HELD_IN_ESCROW' } },
        },
      });
      count++;
    }
  }
  console.log(`${count} mission(s) Agence en cours créée(s).`);

  count = 0;
  const agencyMissionAmounts = [];
  for (const slug of CATEGORY_SLUGS) {
    for (let i = 0; i < 4; i++) {
      const [title, description] = taskFor(slug, i + 5);
      const fullTitle = `${title} — agence terminée #${count + 1}`;
      if (await missionExists(fullTitle, agency.id)) { count++; continue; }
      const client = await nextClientUser();
      const hours = 2 + (count % 4);
      const rate = 20 + (count % 6);
      const corporateCode = generateCorporateCode(slug);
      const mission = await prisma.mission.create({
        data: {
          categoryId: categories[slug].id, title: fullTitle, description, address: nextAddress(),
          desiredDate: daysAgo(2 + count), estimatedHours: hours,
          clientId: client.id, corporateAgencyId: agency.id, corporateCode,
          visibility: 'PRIVATE', status: 'COMPLETED',
        },
      });
      const offer = await prisma.offer.create({ data: { missionId: mission.id, providerId: agency.id, hourlyRate: rate, status: 'ACCEPTED' } });
      const totalAmount = round2(hours * rate);
      await prisma.booking.create({
        data: {
          missionId: mission.id, offerId: offer.id, clientId: client.id, providerId: agency.id,
          scheduledDate: mission.desiredDate, hours, hourlyRate: rate, totalAmount, status: 'COMPLETED',
          payment: { create: { amount: totalAmount, platformFee: 0, managerFee: 0, providerFee: 0, providerPayout: totalAmount, status: 'RELEASED', paidAt: mission.desiredDate, releasedAt: mission.desiredDate } },
        },
      });
      agencyMissionAmounts.push(totalAmount);
      await prisma.invoice.upsert({
        where: { reference: `${corporateCode}-SERVICES34` },
        update: {},
        create: { agencyId: agency.id, kind: 'AGENCY_MISSION', reference: `${corporateCode}-SERVICES34`, missionId: mission.id, amount: totalAmount },
      });
      count++;
    }
  }
  console.log(`${count} mission(s) Agence terminée(s) + facture(s) créée(s).`);

  const julyAgenceRef = '2026-07-SERVICES34';
  const julyAgenceTotal = round2(agencyMissionAmounts.reduce((s, a) => s + a, 0));
  await prisma.invoice.upsert({
    where: { reference: julyAgenceRef },
    update: { amount: julyAgenceTotal },
    create: { agencyId: agency.id, kind: 'AGENCY_MONTHLY', reference: julyAgenceRef, periodYear: 2026, periodMonth: 7, amount: julyAgenceTotal },
  });
  console.log(`Facture mensuelle Agence juillet 2026 : ${julyAgenceRef} (${julyAgenceTotal} €).`);

  console.log('\nDémo complète prête — 20 par étape (demandes reçues, publiées Jobber, en cours Jobber, terminées Jobber, en cours Agence, terminées Agence), 20 employés, factures par mission + mensuelles.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
