// One-off: removes the throwaway accounts/mission created while verifying
// the Stripe payment checkout and in-app payout flows. Does NOT touch the
// 10 permanent Béziers test missions. Run once via
// `node scripts/cleanupPaymentTestAccounts.js`.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_EMAILS = ['test-payment-manager@example.com', 'test-payment-jobber@example.com'];

async function main() {
  const users = await prisma.user.findMany({ where: { email: { in: TEST_EMAILS } } });
  if (users.length === 0) {
    console.log('Aucun compte de test trouvé — déjà nettoyé.');
    return;
  }
  const userIds = users.map((u) => u.id);

  const missions = await prisma.mission.findMany({ where: { clientId: { in: userIds } } });
  const missionIds = missions.map((m) => m.id);

  const bookings = await prisma.booking.findMany({ where: { missionId: { in: missionIds } } });
  const bookingIds = bookings.map((b) => b.id);

  const profiles = await prisma.providerProfile.findMany({ where: { userId: { in: userIds } } });
  const profileIds = profiles.map((p) => p.id);

  await prisma.review.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
  await prisma.payout.deleteMany({ where: { providerId: { in: profileIds } } });
  await prisma.conversation.deleteMany({ where: { missionId: { in: missionIds } } });
  await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
  await prisma.offer.deleteMany({ where: { missionId: { in: missionIds } } });
  await prisma.mission.deleteMany({ where: { id: { in: missionIds } } });
  await prisma.providerCategory.deleteMany({ where: { providerId: { in: profileIds } } });
  await prisma.providerProfile.deleteMany({ where: { id: { in: profileIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });

  console.log(`Supprimé ${users.length} compte(s), ${missions.length} mission(s), ${bookings.length} réservation(s).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
