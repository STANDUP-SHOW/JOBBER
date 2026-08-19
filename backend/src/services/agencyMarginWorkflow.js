const prisma = require('../config/prisma');
const { notifyAgencyOfferSelected } = require('./notificationService');

// Services34↔Jobber quote/margin workflow: once a demande the agency
// published to Jobber has gathered 5 offers OR sat open 11h, the best
// (cheapest total) PENDING offer is auto-picked as SELECTED — the others
// are REJECTED — so the agency can build a client devis from it (see
// POST /offers/:id/quote in agency-admin.routes.js). Lazily evaluated
// (no cron): called whenever the agency loads a list that would show
// these missions, so the transition happens on the next page view after
// the trigger condition is met rather than instantly.
const OFFER_COUNT_TRIGGER = 5;
const TIME_TRIGGER_MS = 11 * 60 * 60 * 1000;

async function runAutoSelect(agencyId) {
  const missions = await prisma.mission.findMany({
    where: {
      corporateAgencyId: agencyId,
      visibility: 'PUBLIC',
      status: 'OPEN',
      offers: { some: { status: 'PENDING' } },
    },
    select: {
      id: true, title: true, createdAt: true, estimatedHours: true,
      offers: { where: { status: 'PENDING' }, select: { id: true, hourlyRate: true, hours: true, extraFees: true } },
    },
  });

  for (const mission of missions) {
    const elapsedMs = Date.now() - new Date(mission.createdAt).getTime();
    if (mission.offers.length < OFFER_COUNT_TRIGGER && elapsedMs < TIME_TRIGGER_MS) continue;

    const withTotals = mission.offers.map((o) => {
      const hours = o.hours ?? mission.estimatedHours;
      const extraFeesTotal = (o.extraFees || []).reduce((sum, f) => sum + f.amount, 0);
      return { id: o.id, total: o.hourlyRate * hours + extraFeesTotal };
    });
    const winner = withTotals.reduce((best, o) => (o.total < best.total ? o : best), withTotals[0]);

    await prisma.$transaction([
      prisma.offer.update({ where: { id: winner.id }, data: { status: 'SELECTED' } }),
      prisma.offer.updateMany({
        where: { missionId: mission.id, id: { not: winner.id }, status: 'PENDING' },
        data: { status: 'REJECTED' },
      }),
    ]);
    notifyAgencyOfferSelected(mission.id, mission.title, agencyId);
  }
}

module.exports = { runAutoSelect };
