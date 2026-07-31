const prisma = require('../config/prisma');

// Standard fee: Jobber (the platform) keeps a flat 5€ per mission, split
// 2,50€ added to what the manager pays and 2,50€ held back from what the
// jobber receives. A MANAGER-family subscription can waive the manager's
// share (up to their plan's monthly mission quota); a JOBBER-family
// subscription independently waives the jobber's share up to *its* quota.
// Company accounts (ENTREPRISE/CORPORATE) use a different, simpler model:
// a flat 10€ fee on the company's side only — the jobber pays nothing.
const MANAGER_FEE = 2.5;
const PROVIDER_FEE = 2.5;
const ENTERPRISE_MANAGER_FEE = 10;
const PLAN_LIMITS = {
  MANAGER_BOSS: 10, MANAGER_HOLDER: Infinity,
  ENTERPRISE_20: 20, ENTERPRISE_50: 50, ENTERPRISE_UNLIMITED: Infinity,
  JOBBER_SILVER: 10, JOBBER_GOLD: 20, JOBBER_PLATINUM: Infinity,
};

function round2(n) { return Math.round(n * 100) / 100; }

// Shared by "manager accepts an offer" (offers.routes.js /accept, standard
// branch) and "jobber GETs a GET Mission" (missions.routes.js /get) — both
// create the same kind of Booking/Payment, with the same fee and
// subscription-waiver logic. `totalAmount` is passed in rather than derived
// from offer.hourlyRate * hours so a GET Mission's fixed price is charged
// exactly, with no rounding drift. Excludes the "Mission Agence" branch
// (corporate agency quoting its own client), which never carries a platform
// fee and stays local to offers.routes.js.
async function finalizeBooking({ offer, mission, clientId, clientAccountKind, totalAmount }) {
  const isCompanyClient = clientAccountKind === 'COMPANY';

  const [managerSub, providerSub] = await Promise.all([
    prisma.subscription.findFirst({ where: { userId: clientId, family: 'MANAGER' } }),
    isCompanyClient ? null : prisma.subscription.findFirst({ where: { userId: offer.providerId, family: 'JOBBER' } }),
  ]);

  let managerFee = isCompanyClient ? ENTERPRISE_MANAGER_FEE : MANAGER_FEE;
  let feeWaived = false;
  let quotaExceeded = false;
  const managerSubActive = managerSub?.status === 'ACTIVE' && managerSub.currentPeriodEnd > new Date();
  if (managerSubActive) {
    if (managerSub.missionsUsedInPeriod < PLAN_LIMITS[managerSub.plan]) {
      managerFee = 0;
      feeWaived = true;
    } else {
      quotaExceeded = true;
    }
  }

  let providerFee = isCompanyClient ? 0 : PROVIDER_FEE;
  let providerFeeWaived = false;
  const providerSubActive = providerSub?.status === 'ACTIVE' && providerSub.currentPeriodEnd > new Date();
  if (providerSubActive && providerSub.missionsUsedInPeriod < PLAN_LIMITS[providerSub.plan]) {
    providerFee = 0;
    providerFeeWaived = true;
  }

  const chargeAmount = round2(totalAmount + managerFee);
  const providerPayout = round2(totalAmount - providerFee);

  const [booking] = await prisma.$transaction([
    prisma.booking.create({
      data: {
        missionId: offer.missionId,
        offerId: offer.id,
        clientId,
        providerId: offer.providerId,
        scheduledDate: mission.desiredDate,
        hours: mission.estimatedHours,
        hourlyRate: offer.hourlyRate,
        totalAmount,
        payment: {
          create: {
            amount: chargeAmount,
            platformFee: round2(managerFee + providerFee),
            managerFee,
            providerFee,
            feeWaived,
            providerPayout,
          },
        },
      },
    }),
    prisma.mission.update({ where: { id: offer.missionId }, data: { status: 'ASSIGNED' } }),
    prisma.offer.update({ where: { id: offer.id }, data: { status: 'ACCEPTED' } }),
    prisma.offer.updateMany({
      where: { missionId: offer.missionId, id: { not: offer.id }, status: 'PENDING' },
      data: { status: 'REJECTED' },
    }),
    ...(feeWaived
      ? [prisma.subscription.update({ where: { id: managerSub.id }, data: { missionsUsedInPeriod: { increment: 1 } } })]
      : []),
    ...(providerFeeWaived
      ? [prisma.subscription.update({ where: { id: providerSub.id }, data: { missionsUsedInPeriod: { increment: 1 } } })]
      : []),
  ]);

  return { booking, feeWaived, quotaExceeded, plan: managerSub?.plan || null, providerFeeWaived };
}

module.exports = { finalizeBooking, round2 };
