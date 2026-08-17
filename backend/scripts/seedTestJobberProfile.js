// One-off seeder: a single jobber test account with real data in every
// section of the account/dashboard menu (profile, missions à réaliser,
// historique, offres, portefeuille, avis, badges, diplômes, cours,
// messagerie, factures, attestations fiscales) — so the whole nav can be
// visually reviewed at once instead of hunting for individually-populated
// test users. Safe to re-run: deletes and recreates only this account's
// own data, never touches anything else.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PASSWORD = 'TestJobber2026!';
const JOBBER_EMAIL = 'test.jobber@jobber.local';
const CLIENT_EMAILS = ['test.client1@jobber.local', 'test.client2@jobber.local', 'test.client3@jobber.local'];
const HELPER_PROVIDER_EMAIL = 'test.helper.provider@jobber.local';

const BEZIERS = { lat: 43.3442, lng: 3.2158, address: '5 Allée Paul Riquet, 34500 Béziers, France' };

function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}
function daysAgo(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}
function daysFromNow(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function upsertUser(email, data) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, isEmailVerified: true, ...data },
  });
}

async function wipePreviousRun(userId) {
  // Delete this user's own dependent rows (as provider or client) before
  // recreating them, without touching any other account's data.
  const bookingIds = (
    await prisma.booking.findMany({ where: { OR: [{ providerId: userId }, { clientId: userId }] }, select: { id: true } })
  ).map((b) => b.id);
  const missionIds = (
    await prisma.mission.findMany({ where: { clientId: userId }, select: { id: true } })
  ).map((m) => m.id);
  const offerMissionIds = (
    await prisma.offer.findMany({ where: { providerId: userId }, select: { missionId: true } })
  ).map((o) => o.missionId);
  const allMissionIds = [...new Set([...missionIds, ...offerMissionIds])];
  const convIds = (
    await prisma.conversation.findMany({ where: { OR: [{ clientId: userId }, { providerId: userId }] }, select: { id: true } })
  ).map((c) => c.id);

  await prisma.review.deleteMany({ where: { OR: [{ authorId: userId }, { targetId: userId }] } });
  await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
  await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
  await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
  await prisma.offer.deleteMany({ where: { OR: [{ providerId: userId }, { missionId: { in: allMissionIds } }] } });
  await prisma.mission.deleteMany({ where: { id: { in: allMissionIds } } });
  await prisma.payout.deleteMany({ where: { provider: { userId } } });
  await prisma.verificationDocument.deleteMany({ where: { userId } });
  await prisma.subscription.deleteMany({ where: { userId, family: 'JOBBER' } });
}

async function main() {
  const menage = await prisma.category.findUnique({ where: { slug: 'menage' } });
  const jardinage = await prisma.category.findUnique({ where: { slug: 'jardinage' } });
  const cours = await prisma.category.findUnique({ where: { slug: 'cours-particuliers' } });
  if (!menage || !jardinage) throw new Error('Catégories menage/jardinage introuvables — vérifier les slugs.');
  const menageService = await prisma.service.findFirst({ where: { categoryId: menage.id } });
  const lessonCategory = cours || menage;

  const jobber = await upsertUser(JOBBER_EMAIL, {
    firstName: 'Julien',
    lastName: 'Testeur',
    phone: '0611223344',
    isProfessional: true,
    address: BEZIERS.address,
    lat: BEZIERS.lat,
    lng: BEZIERS.lng,
    creditBalance: 18.5,
    createdAt: monthsAgo(14),
  });
  // createdAt is only honored by Prisma on create, not the upsert `update`
  // branch above (and @updatedAt would otherwise stamp "now" on every
  // re-run) — force it explicitly so the tenure badge keeps working.
  await prisma.user.update({ where: { id: jobber.id }, data: { createdAt: monthsAgo(14) } });

  await wipePreviousRun(jobber.id);

  const clients = [];
  for (const [i, email] of CLIENT_EMAILS.entries()) {
    clients.push(await upsertUser(email, {
      firstName: ['Camille', 'Nicolas', 'Léa'][i],
      lastName: 'Client',
      address: BEZIERS.address,
      lat: BEZIERS.lat + (i - 1) * 0.01,
      lng: BEZIERS.lng + (i - 1) * 0.01,
    }));
  }
  const helperProvider = await upsertUser(HELPER_PROVIDER_EMAIL, {
    firstName: 'Marie', lastName: 'Prestataire', address: BEZIERS.address, lat: BEZIERS.lat, lng: BEZIERS.lng,
  });
  await prisma.providerProfile.upsert({
    where: { userId: helperProvider.id },
    update: {},
    create: { userId: helperProvider.id, verificationStatus: 'APPROVED', payoutsEnabled: true },
  });

  // --- Provider profile: filled out, professional, verified -------------
  await prisma.providerProfile.deleteMany({ where: { userId: jobber.id } });
  const profile = await prisma.providerProfile.create({
    data: {
      userId: jobber.id,
      radiusKm: 20,
      verificationStatus: 'APPROVED',
      ratingAverage: 4.8,
      ratingCount: 10,
      completedMissions: 12,
      walletBalance: 245.5,
      offersLessons: true,
      payoutsEnabled: true,
      bankLast4: '4242',
      bankHolderName: 'Julien Testeur',
      categories: {
        create: [
          { categoryId: menage.id, level: 'PROFESSIONNEL', hourlyRate: 18, bio: "Ménage à domicile, sérieux et minutieux, disponible toute la semaine." },
          { categoryId: jardinage.id, level: 'PASSIONNE', hourlyRate: 15, bio: 'Entretien de jardin, tonte, taille de haies.' },
        ],
      },
      vehicles: { create: [{ type: 'VOITURE_TOURISME' }] },
    },
  });
  if (menageService) {
    await prisma.providerService.create({ data: { providerId: profile.id, serviceId: menageService.id } });
  }

  // --- Completed missions: 10x Ménage (-> EXPERT_10), 2x Jardinage ------
  const completedSpecs = [
    ...Array.from({ length: 10 }, (_, i) => ({ category: menage, title: `Ménage récurrent chez ${['Camille', 'Nicolas', 'Léa'][i % 3]} #${i + 1}`, daysAgo: 20 + i * 6, hours: 2, rate: 18 })),
    ...Array.from({ length: 2 }, (_, i) => ({ category: jardinage, title: `Entretien jardin #${i + 1}`, daysAgo: 15 + i * 10, hours: 3, rate: 15 })),
  ];

  for (const [i, spec] of completedSpecs.entries()) {
    const client = clients[i % clients.length];
    const total = spec.hours * spec.rate;
    const mission = await prisma.mission.create({
      data: {
        clientId: client.id,
        categoryId: spec.category.id,
        title: spec.title,
        description: 'Mission test — données de démonstration pour vérifier l\'affichage du profil jobber.',
        address: BEZIERS.address,
        lat: BEZIERS.lat,
        lng: BEZIERS.lng,
        desiredDate: daysAgo(spec.daysAgo),
        estimatedHours: spec.hours,
        status: 'COMPLETED',
      },
    });
    const offer = await prisma.offer.create({
      data: { missionId: mission.id, providerId: jobber.id, hourlyRate: spec.rate, status: 'ACCEPTED' },
    });
    const booking = await prisma.booking.create({
      data: {
        missionId: mission.id, offerId: offer.id, clientId: client.id, providerId: jobber.id,
        scheduledDate: daysAgo(spec.daysAgo), hours: spec.hours, hourlyRate: spec.rate, totalAmount: total,
        status: 'COMPLETED',
      },
    });
    await prisma.payment.create({
      data: {
        bookingId: booking.id, amount: total, platformFee: total * 0.1, providerPayout: total * 0.9,
        status: 'RELEASED', paidAt: daysAgo(spec.daysAgo), releasedAt: daysAgo(spec.daysAgo - 1),
      },
    });
    await prisma.review.create({
      data: {
        bookingId: booking.id, authorId: client.id, targetId: jobber.id,
        rating: i % 5 === 0 ? 4 : 5,
        comment: ['Super travail, très ponctuel.', 'Rien à redire, je recommande.', 'Efficace et sympathique.'][i % 3],
      },
    });
    if (i < 3) {
      const conv = await prisma.conversation.create({ data: { missionId: mission.id, clientId: client.id, providerId: jobber.id } });
      await prisma.message.createMany({
        data: [
          { conversationId: conv.id, senderId: client.id, content: 'Bonjour, est-ce que vous êtes disponible pour cette mission ?' },
          { conversationId: conv.id, senderId: jobber.id, content: 'Bonjour, oui tout à fait, je confirme ma disponibilité.' },
          { conversationId: conv.id, senderId: client.id, content: 'Parfait, merci beaucoup !' },
        ],
      });
    }
  }

  // --- One completed lesson given (-> lesson-history "données") ---------
  {
    const client = clients[0];
    const mission = await prisma.mission.create({
      data: {
        type: 'LESSON', clientId: client.id, categoryId: lessonCategory.id,
        title: 'Cours de jardinage débutant', description: 'Apprentissage des bases de jardinage.',
        address: BEZIERS.address, lat: BEZIERS.lat, lng: BEZIERS.lng,
        desiredDate: daysAgo(8), estimatedHours: 2, status: 'COMPLETED',
      },
    });
    const offer = await prisma.offer.create({ data: { missionId: mission.id, providerId: jobber.id, hourlyRate: 20, status: 'ACCEPTED' } });
    const booking = await prisma.booking.create({
      data: { missionId: mission.id, offerId: offer.id, clientId: client.id, providerId: jobber.id, scheduledDate: daysAgo(8), hours: 2, hourlyRate: 20, totalAmount: 40, status: 'COMPLETED' },
    });
    await prisma.payment.create({ data: { bookingId: booking.id, amount: 40, platformFee: 4, providerPayout: 36, status: 'RELEASED', paidAt: daysAgo(8), releasedAt: daysAgo(7) } });
  }

  // --- Active/upcoming missions (-> "Missions à réaliser") ---------------
  for (const [i, spec] of [{ daysFromNow: 3, hours: 2 }, { daysFromNow: 9, hours: 4 }].entries()) {
    const client = clients[i % clients.length];
    const mission = await prisma.mission.create({
      data: {
        clientId: client.id, categoryId: menage.id, title: `Ménage à venir #${i + 1}`,
        description: 'Mission test à venir.', address: BEZIERS.address, lat: BEZIERS.lat, lng: BEZIERS.lng,
        desiredDate: daysFromNow(spec.daysFromNow), estimatedHours: spec.hours, status: 'ASSIGNED',
      },
    });
    const offer = await prisma.offer.create({ data: { missionId: mission.id, providerId: jobber.id, hourlyRate: 18, status: 'ACCEPTED' } });
    await prisma.booking.create({
      data: { missionId: mission.id, offerId: offer.id, clientId: client.id, providerId: jobber.id, scheduledDate: daysFromNow(spec.daysFromNow), hours: spec.hours, hourlyRate: 18, totalAmount: spec.hours * 18, status: 'SCHEDULED' },
    });
  }

  // --- Pending / rejected offers (-> "Mes offres") -----------------------
  for (const [i, status] of ['PENDING', 'PENDING', 'REJECTED'].entries()) {
    const client = clients[i % clients.length];
    const mission = await prisma.mission.create({
      data: {
        clientId: client.id, categoryId: (i === 2 ? jardinage : menage).id, title: `Besoin ouvert #${i + 1}`,
        description: 'Mission test ouverte.', address: BEZIERS.address, lat: BEZIERS.lat, lng: BEZIERS.lng,
        desiredDate: daysFromNow(5 + i), estimatedHours: 2, status: 'OPEN',
      },
    });
    await prisma.offer.create({ data: { missionId: mission.id, providerId: jobber.id, hourlyRate: 17, status, refusalReason: status === 'REJECTED' ? 'Créneau finalement indisponible' : undefined } });
  }

  // --- Diplomas (-> "Mes diplômes") --------------------------------------
  await prisma.verificationDocument.createMany({
    data: [
      { userId: jobber.id, type: 'DIPLOMA', fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', status: 'APPROVED' },
      { userId: jobber.id, type: 'DIPLOMA', fileUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', status: 'PENDING' },
    ],
  });

  // --- Jobber-family subscription (-> "Cartes Jobber+") ------------------
  await prisma.subscription.create({
    data: { userId: jobber.id, family: 'JOBBER', plan: 'JOBBER_GOLD', status: 'ACTIVE', currentPeriodEnd: daysFromNow(20) },
  });

  // --- This user AS CLIENT too: posts + pays for a mission themselves
  // (-> "Mes factures" / "Attestations fiscales" / "Crédit d'impôt", which
  // are all keyed off bookings where THIS user is the client). ------------
  {
    const mission = await prisma.mission.create({
      data: {
        clientId: jobber.id, categoryId: menage.id, title: 'Grand ménage avant réception',
        description: 'Mission test postée par ce compte en tant que particulier employeur.',
        address: BEZIERS.address, lat: BEZIERS.lat, lng: BEZIERS.lng,
        desiredDate: daysAgo(12), estimatedHours: 3, status: 'COMPLETED',
      },
    });
    const offer = await prisma.offer.create({ data: { missionId: mission.id, providerId: helperProvider.id, hourlyRate: 16, status: 'ACCEPTED' } });
    const booking = await prisma.booking.create({
      data: { missionId: mission.id, offerId: offer.id, clientId: jobber.id, providerId: helperProvider.id, scheduledDate: daysAgo(12), hours: 3, hourlyRate: 16, totalAmount: 48, status: 'COMPLETED' },
    });
    await prisma.payment.create({ data: { bookingId: booking.id, amount: 48, platformFee: 4.8, providerPayout: 43.2, status: 'RELEASED', paidAt: daysAgo(12), releasedAt: daysAgo(11) } });
  }

  console.log('\nProfil test jobber prêt.');
  console.log(`Email : ${JOBBER_EMAIL}`);
  console.log(`Mot de passe : ${PASSWORD}`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
