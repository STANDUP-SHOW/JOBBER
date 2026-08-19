// Central fan-out for activity-driven notifications: every call here records
// an in-app Notification row (powers the header bell), then emails and/or
// web-pushes the user per their own notifyEmailActivity/notifyPushActivity
// preference. Distinct from emailService.js, which only ever sends email —
// this wraps it for the three-channel activity events (see NOTIFICATION_TYPES
// below); marketing/news emails and the two pre-existing transactional flows
// (welcome, password reset) stay exactly as they were, untouched.
const webpush = require('web-push');
const prisma = require('../config/prisma');
const { sendBrandedEmail } = require('./emailService');
const { resolveBrandKeyForAgencyId } = require('../utils/agency');
const { haversineDistanceKm } = require('./geocodingService');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@jobberplus.fr';
const pushConfigured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (pushConfigured) webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const NOTIFICATION_TYPES = {
  MISSION_MATCH: 'MISSION_MATCH',
  MISSION_PUBLISHED: 'MISSION_PUBLISHED',
  OFFER_RECEIVED: 'OFFER_RECEIVED',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  MISSION_STARTING_24H: 'MISSION_STARTING_24H',
  MISSION_STARTING_1H: 'MISSION_STARTING_1H',
  MISSION_COMPLETED: 'MISSION_COMPLETED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  AGENCY_VALIDATION_NEEDED: 'AGENCY_VALIDATION_NEEDED',
};

function siteUrl(brandKey) {
  return (brandKey === 'services34' ? process.env.SERVICES34_URL : process.env.JOBBER_SITE_URL) || 'https://jobberplus.fr';
}

async function sendPush(userId, { title, body, link }) {
  if (!pushConfigured) return;
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (!subs.length) return;
  const payload = JSON.stringify({ title, body, link: link || '/' });
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
    } catch (err) {
      // The browser unsubscribed on its own since we last saw it — drop the dead row.
      if (err.statusCode === 404 || err.statusCode === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        console.error('Push send failed:', err.message);
      }
    }
  }));
}

// `skipEmail` is set by callers that already sent their own richly-templated
// email for this same event via emailService.js (mission published, offer
// accepted) — this still records the in-app row and push, just without a
// second, plainer email on top of the one already sent.
async function notify(userId, { type, title, body, link, brandKey = 'jobber', skipEmail = false }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, notifyEmailActivity: true, notifyPushActivity: true },
    });
    if (!user) return;

    await prisma.notification.create({ data: { userId, type, title, body, link } });

    const tasks = [];
    if (!skipEmail && user.notifyEmailActivity) {
      tasks.push(sendBrandedEmail(brandKey, user.email, title, `
        <p>Bonjour ${user.firstName || ''},</p>
        <p>${body}</p>
        ${link ? `<p><a href="${siteUrl(brandKey)}${link}" style="color:#3f6b4f;">Voir sur ${brandKey === 'services34' ? 'Services 34' : 'Jobber+'}</a></p>` : ''}
      `));
    }
    if (user.notifyPushActivity) tasks.push(sendPush(userId, { title, body, link }));
    await Promise.all(tasks);
  } catch (err) {
    console.error('notify() failed:', err);
  }
}

// A jobber applied to your mission. For a corporate-agency mission where
// the agency itself is the mission's clientId ("Nouvelle mission agence"),
// this is deliberately skipped — the agency shouldn't get pinged for every
// raw offer during the 5-offers/11h collection window; it only hears about
// the one offer runAutoSelect actually picks (see notifyAgencyOfferSelected
// in agencyMarginWorkflow.js). A "demande" mission (clientId = the real end
// requester, distinct from the agency) still notifies normally.
async function notifyOfferReceived(offerId) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { mission: { select: { id: true, title: true, clientId: true, corporateAgencyId: true } }, provider: { select: { firstName: true } } },
  });
  if (!offer) return;
  if (offer.mission.clientId === offer.mission.corporateAgencyId) return;
  const brandKey = await resolveBrandKeyForAgencyId(offer.mission.corporateAgencyId);
  await notify(offer.mission.clientId, {
    type: NOTIFICATION_TYPES.OFFER_RECEIVED,
    title: `Nouvelle offre pour "${offer.mission.title}"`,
    body: `${offer.provider.firstName || 'Un jobber'} a proposé son offre pour votre mission.`,
    link: `/missions/${offer.mission.id}`,
    brandKey,
  });
}

// The one offer runAutoSelect actually picked, once the 5-offers/11h window
// closes — this is the ONLY offer-arrival notification the agency gets for
// its own corporate missions (see notifyOfferReceived above).
async function notifyAgencyOfferSelected(missionId, missionTitle, agencyId) {
  const brandKey = await resolveBrandKeyForAgencyId(agencyId);
  await notify(agencyId, {
    type: NOTIFICATION_TYPES.OFFER_RECEIVED,
    title: 'Offre Jobber+ reçue',
    body: `Offre Jobber+ reçue pour la mission "${missionTitle}".`,
    link: '/admin/offres-jobber',
    brandKey,
  });
}

// Companion to emailService.notifyBookingAccepted — same trigger, adds the
// in-app row + push for the provider without re-sending the email it
// already sent.
async function notifyOfferAccepted(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { mission: { select: { id: true, title: true, corporateAgencyId: true } } },
  });
  if (!booking) return;
  const brandKey = await resolveBrandKeyForAgencyId(booking.mission.corporateAgencyId);
  await notify(booking.providerId, {
    type: NOTIFICATION_TYPES.OFFER_ACCEPTED,
    title: `Offre acceptée : ${booking.mission.title}`,
    body: `Votre offre pour "${booking.mission.title}" a été acceptée.`,
    link: `/missions/${booking.mission.id}`,
    brandKey,
    skipEmail: true,
  });
}

// Companion to emailService.sendMissionPublishedEmail — same trigger, adds
// the in-app row + push without re-sending the email. Also fans out a
// separate MISSION_MATCH notification to every jobber whose category and
// intervention radius cover this new (public) mission.
async function notifyMissionPublished(missionId) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { id: true, title: true, clientId: true, categoryId: true, lat: true, lng: true, corporateAgencyId: true, visibility: true },
  });
  if (!mission) return;
  const brandKey = await resolveBrandKeyForAgencyId(mission.corporateAgencyId);

  await notify(mission.clientId, {
    type: NOTIFICATION_TYPES.MISSION_PUBLISHED,
    title: `Votre besoin "${mission.title}" est publié`,
    body: `Votre mission "${mission.title}" est en ligne.`,
    link: `/missions/${mission.id}`,
    brandKey,
    skipEmail: true,
  });

  if (mission.visibility !== 'PUBLIC' || mission.lat == null || mission.lng == null) return;
  const candidates = await prisma.providerProfile.findMany({
    where: { categories: { some: { categoryId: mission.categoryId } } },
    select: { userId: true, radiusKm: true, user: { select: { lat: true, lng: true } } },
  });
  await Promise.all(candidates.map((c) => {
    if (c.user.lat == null || c.user.lng == null) return null;
    if (haversineDistanceKm(c.user.lat, c.user.lng, mission.lat, mission.lng) > c.radiusKm) return null;
    return notify(c.userId, {
      type: NOTIFICATION_TYPES.MISSION_MATCH,
      title: 'Nouvelle mission dans vos compétences',
      body: `"${mission.title}" vient d'être publiée près de chez vous.`,
      link: `/missions/${mission.id}`,
      brandKey,
    });
  }));
}

// Client validated the jobber's work — notify both sides.
async function notifyMissionCompleted(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { mission: { select: { id: true, title: true, corporateAgencyId: true } } },
  });
  if (!booking) return;
  const brandKey = await resolveBrandKeyForAgencyId(booking.mission.corporateAgencyId);
  await Promise.all([
    notify(booking.providerId, {
      type: NOTIFICATION_TYPES.MISSION_COMPLETED,
      title: `Mission terminée : ${booking.mission.title}`,
      body: `Le client a validé la fin de la mission "${booking.mission.title}". Le paiement va être versé.`,
      link: `/missions/${booking.mission.id}`,
      brandKey,
    }),
    notify(booking.clientId, {
      type: NOTIFICATION_TYPES.MISSION_COMPLETED,
      title: `Mission terminée : ${booking.mission.title}`,
      body: `Votre mission "${booking.mission.title}" est marquée terminée.`,
      link: `/missions/${booking.mission.id}`,
      brandKey,
    }),
  ]);
}

// Jobber marked their work done on a corporate-agency-sourced mission — the
// real end client already paid upfront at devis-acceptance, so it's the
// agency (not the client) who validates completion and releases the
// payment/commissions. Notifies the agency's own User row (its back-office
// login account), the only recipient a corporate account resolves to.
async function notifyAgencyMissionAwaitingValidation(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { mission: { select: { id: true, title: true, corporateAgencyId: true } } },
  });
  if (!booking?.mission.corporateAgencyId) return;
  const brandKey = await resolveBrandKeyForAgencyId(booking.mission.corporateAgencyId);
  await notify(booking.mission.corporateAgencyId, {
    type: NOTIFICATION_TYPES.AGENCY_VALIDATION_NEEDED,
    title: `Mission terminée par le jobber : ${booking.mission.title}`,
    body: `Le jobber a marqué "${booking.mission.title}" comme terminée. Validez pour déclencher son paiement.`,
    link: '/admin/missions-jobber-en-cours',
    brandKey,
  });
}

// Escrow released to the jobber's wallet.
async function notifyPaymentReceived(bookingId, amount) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { mission: { select: { id: true, title: true, corporateAgencyId: true } } },
  });
  if (!booking) return;
  const brandKey = await resolveBrandKeyForAgencyId(booking.mission.corporateAgencyId);
  await notify(booking.providerId, {
    type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
    title: 'Paiement reçu',
    body: `${amount.toFixed(2)} € viennent d'être ajoutés à votre portefeuille pour "${booking.mission.title}".`,
    link: '/dashboard/wallet',
    brandKey,
  });
}

// Mission is about to start — used by scripts/sendBookingReminders.js.
async function notifyMissionStartingSoon(bookingId, hoursLabel) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { mission: { select: { id: true, title: true, corporateAgencyId: true } } },
  });
  if (!booking) return;
  const brandKey = await resolveBrandKeyForAgencyId(booking.mission.corporateAgencyId);
  const type = hoursLabel === '1h' ? NOTIFICATION_TYPES.MISSION_STARTING_1H : NOTIFICATION_TYPES.MISSION_STARTING_24H;
  const label = hoursLabel === '1h' ? 'dans 1 heure' : 'dans 24 heures';
  await notify(booking.providerId, {
    type, title: `Mission bientôt : ${booking.mission.title}`,
    body: `Votre mission "${booking.mission.title}" démarre ${label}.`,
    link: `/missions/${booking.mission.id}`, brandKey,
  });
}

module.exports = {
  NOTIFICATION_TYPES,
  notify,
  notifyOfferReceived,
  notifyOfferAccepted,
  notifyMissionPublished,
  notifyMissionCompleted,
  notifyPaymentReceived,
  notifyMissionStartingSoon,
  notifyAgencyMissionAwaitingValidation,
  notifyAgencyOfferSelected,
};
