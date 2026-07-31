// One-off: creates 10 test "GET Mission" TASK missions (fixed non-negotiable
// price, first-come-first-served) posted by a test entreprise account, to
// exercise the feature end-to-end. Purely additive — does not touch any
// existing user, mission, or data. Safe to run once; re-running will create
// duplicate missions (no uniqueness guard on title), so don't run it twice.
// Run once via `node scripts/seedGetMissions.js`.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { geocodeAddress } = require('../src/services/geocodingService');

const prisma = new PrismaClient();

const CLIENT_EMAIL = 'entreprise-test-get@jobber.local';

function daysFromNow(n, hour, minute) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const GET_MISSIONS = [
  { categorySlug: 'menage', title: 'Nettoyage de bureaux avant réouverture', description: "Nettoyage complet de bureaux (sols, sanitaires, vitres) avant réouverture au public.", address: '14 Rue de la Citadelle, Béziers', desiredDate: daysFromNow(2, 8, 0), estimatedHours: 2, getMissionPrice: 60 },
  { categorySlug: 'bricolage', title: 'Montage de mobilier de bureau', description: "Montage de bureaux et caissons livrés à plat pour un open-space de 10 postes.", address: '4 Rue Boieldieu, Béziers', desiredDate: daysFromNow(3, 9, 0), estimatedHours: 3, getMissionPrice: 90 },
  { categorySlug: 'jardinage', title: 'Entretien espaces verts entrepôt', description: "Tonte et taille des haies autour d'un entrepôt logistique.", address: '11 Chemin des Vignes, 34290 Servian', desiredDate: daysFromNow(4, 8, 0), estimatedHours: 2, getMissionPrice: 70 },
  { categorySlug: 'demenagement', title: 'Déménagement de mobilier de bureau', description: "Transfert de mobilier de bureau entre deux sites de l'entreprise.", address: '6 Rue Boieldieu, Béziers', dropoffAddress: '18 Avenue Georges Clemenceau, Agde', desiredDate: daysFromNow(5, 9, 0), estimatedHours: 4, getMissionPrice: 200, requiredVehicleTypes: ['FOURGONNETTE_9M3'] },
  { categorySlug: 'electricite', title: 'Vérification installation électrique locaux', description: "Contrôle de l'installation électrique de locaux professionnels avant contrôle réglementaire.", address: '12 Rue de la Fontaine, Sérignan', desiredDate: daysFromNow(6, 9, 0), estimatedHours: 2, getMissionPrice: 80 },
  { categorySlug: 'plomberie', title: 'Réparation fuite sanitaires locaux', description: "Réparation d'une fuite au niveau des sanitaires d'un local professionnel.", address: '3 Rue Nationale, Servian', desiredDate: daysFromNow(1, 10, 0), estimatedHours: 1.5, getMissionPrice: 65 },
  { categorySlug: 'manutention', serviceName: 'Cariste', title: 'Chargement/déchargement camion entrepôt', description: "Chargement et déchargement d'un camion de marchandises sur plateforme logistique.", address: '9 Rue Paul Riquet, Béziers', desiredDate: daysFromNow(2, 7, 0), estimatedHours: 3, getMissionPrice: 90, details: { requiresCaces: true, cacesType: 'CACES 3 – Chariot élévateur (≥ 6 t)' } },
  { categorySlug: 'cuisine', serviceName: 'Cuisinier', title: 'Renfort cuisine événement d\'entreprise', description: "Renfort en cuisine pour un événement d'entreprise d'une centaine de couverts.", address: '13 Rue du Château, Pézenas', desiredDate: daysFromNow(7, 15, 0), estimatedHours: 4, getMissionPrice: 140 },
  { categorySlug: 'batiment', serviceName: 'Maçonnerie', title: 'Petits travaux de maçonnerie locaux', description: "Reprise d'un muret abîmé et rebouchage de fissures dans des locaux professionnels.", address: '17 Avenue de la Gare, Sérignan', desiredDate: daysFromNow(8, 8, 0), estimatedHours: 3, getMissionPrice: 110 },
  { categorySlug: 'peinture', title: 'Rafraîchissement peinture bureaux', description: "Rafraîchissement de la peinture de plusieurs bureaux avant l'arrivée de nouveaux locataires.", address: '9 Rue des Jardins, Bédarieux', desiredDate: daysFromNow(9, 9, 0), estimatedHours: 4, getMissionPrice: 130 },
];

async function main() {
  let client = await prisma.user.findUnique({ where: { email: CLIENT_EMAIL } });
  if (!client) {
    client = await prisma.user.create({
      data: {
        email: CLIENT_EMAIL,
        passwordHash: await bcrypt.hash('ChangeMe123!', 10),
        firstName: 'Entreprise',
        lastName: 'Test GET',
        accountKind: 'COMPANY',
        companyType: 'ENTREPRISE',
        companyName: 'Entreprise Test GET Mission',
      },
    });
    console.log(`Compte entreprise de test créé : ${CLIENT_EMAIL}`);
  }

  const categories = await prisma.category.findMany({ include: { services: true } });
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  let created = 0;
  for (const [index, entry] of GET_MISSIONS.entries()) {
    const category = bySlug[entry.categorySlug];
    if (!category) { console.log(`Catégorie inconnue : ${entry.categorySlug}`); continue; }
    const service = entry.serviceName ? category.services.find((s) => s.name === entry.serviceName) : null;

    const [geocoded, dropoffGeocoded] = await Promise.all([
      geocodeAddress(entry.address),
      entry.dropoffAddress ? geocodeAddress(entry.dropoffAddress) : Promise.resolve(null),
    ]);

    await prisma.mission.create({
      data: {
        type: 'TASK',
        clientId: client.id,
        categoryId: category.id,
        serviceId: service?.id,
        title: entry.title,
        description: entry.description,
        address: entry.address,
        lat: geocoded?.lat,
        lng: geocoded?.lng,
        dropoffAddress: entry.dropoffAddress,
        dropoffLat: dropoffGeocoded?.lat,
        dropoffLng: dropoffGeocoded?.lng,
        desiredDate: entry.desiredDate,
        estimatedHours: entry.estimatedHours,
        requiredVehicleTypes: entry.requiredVehicleTypes || [],
        details: entry.details,
        isGetMission: true,
        getMissionPrice: entry.getMissionPrice,
      },
    });
    created++;
    console.log(`${index + 1}/${GET_MISSIONS.length} : ${entry.title} [${category.name}] — ${entry.getMissionPrice} €`);
  }

  console.log(`\n${created} GET Mission(s) créée(s) autour de Béziers, publiée(s) par ${CLIENT_EMAIL}.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
