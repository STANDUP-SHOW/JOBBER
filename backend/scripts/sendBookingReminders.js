// Run on a schedule (Railway Cron, every 15 min — see package.json's
// cron:booking-reminders script) to send "mission starts in 24h/1h"
// notifications. Idempotent: each booking's reminded24hAt/reminded1hAt is
// stamped once sent, so a booking never gets the same reminder twice even
// if the cron window overlaps a previous run.
const { PrismaClient } = require('@prisma/client');
const { notifyMissionStartingSoon } = require('../src/services/notificationService');

const prisma = new PrismaClient();

async function remind(windowStartMin, windowEndMin, field, label) {
  const now = Date.now();
  const windowStart = new Date(now + windowStartMin * 60 * 1000);
  const windowEnd = new Date(now + windowEndMin * 60 * 1000);

  const bookings = await prisma.booking.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledDate: { gte: windowStart, lte: windowEnd },
      [field]: null,
    },
    select: { id: true },
  });

  for (const booking of bookings) {
    await notifyMissionStartingSoon(booking.id, label);
    await prisma.booking.update({ where: { id: booking.id }, data: { [field]: new Date() } });
  }
  console.log(`${label} reminders: ${bookings.length} sent.`);
}

async function main() {
  // ±15 min windows around the 24h/1h marks, matched to how often this
  // script is expected to run — wide enough that a slightly-delayed cron
  // tick never skips a booking sitting right at the boundary.
  await remind(23 * 60 + 45, 24 * 60 + 15, 'reminded24hAt', '24h');
  await remind(45, 75, 'reminded1hAt', '1h');
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
