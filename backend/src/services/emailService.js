const { Resend } = require('resend');
const prisma = require('../config/prisma');
const { resolveBrandKeyForAgencyId } = require('../utils/agency');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// One entry per site sharing this backend. There's no hosted logo image for
// either site (both render their logo as inline SVG in the app, not a static
// asset) — a styled text wordmark is used instead, since email clients often
// block remote images until the reader clicks "afficher les images", which
// would leave an image-only header looking broken on first open.
const BRANDS = {
  jobber: {
    fromEmail: process.env.RESEND_FROM_EMAIL_JOBBER || 'Jobber+ <contact@jobberplus.fr>',
    siteName: 'Jobber+',
    siteUrl: process.env.JOBBER_SITE_URL || 'https://jobberplus.fr',
    color: '#3f6b4f',
    logoHtml: '<span style="color:#3f6b4f;">Jobber</span><span style="color:#d97a34;">+</span>',
  },
  services34: {
    fromEmail: process.env.RESEND_FROM_EMAIL_SERVICES34 || 'Services 34 <contact@services34.fr>',
    siteName: 'Services 34',
    siteUrl: process.env.SERVICES34_URL || 'https://services34.fr',
    color: '#1c3b57',
    logoHtml: '<span style="color:#1c3b57;">Services</span> <span style="color:#f8a703;">34</span>',
  },
};

function brand(key) {
  return BRANDS[key] || BRANDS.jobber;
}

function greeting(firstName) {
  return firstName ? `Bonjour ${firstName},` : 'Bonjour,';
}

// Shared layout every transactional email uses — logo header, body, footer
// with the site's own contact identity. Keeps every email visually
// consistent with whichever site (Jobber or a corporate agency) triggered it.
function wrapEmail(b, bodyHtml) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background:#ffffff;">
      <div style="padding: 24px 32px; border-bottom: 2px solid ${b.color};">
        <span style="font-size: 22px; font-weight: 800;">${b.logoHtml}</span>
      </div>
      <div style="padding: 32px; color: #1a1a1a; font-size: 15px; line-height: 1.6;">
        ${bodyHtml}
      </div>
      <div style="padding: 20px 32px; border-top: 1px solid #eee; color: #888; font-size: 12px;">
        <p style="margin:0;">${b.siteName} — <a href="${b.siteUrl}" style="color:${b.color}; text-decoration:none;">${b.siteUrl.replace('https://', '')}</a></p>
        <p style="margin:4px 0 0;">Vous recevez cet email suite à une action sur votre compte ${b.siteName}.</p>
      </div>
    </div>
  `;
}

async function sendBrandedEmail(brandKey, to, subject, bodyHtml) {
  const b = brand(brandKey);
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipping email "${subject}" to ${to} (${brandKey})`);
    return;
  }
  const { data, error } = await resend.emails.send({ from: b.fromEmail, to, subject, html: wrapEmail(b, bodyHtml) });
  if (error) console.error(`Resend failed to send "${subject}" to ${to}:`, JSON.stringify(error));
  else console.log(`Email "${subject}" sent to ${to} via Resend, id:`, data?.id);
}

async function sendWelcomeEmail(to, { firstName, brandKey = 'jobber' } = {}) {
  const b = brand(brandKey);
  await sendBrandedEmail(brandKey, to, `Bienvenue sur ${b.siteName} !`, `
    <p>${greeting(firstName)}</p>
    <p>Votre compte ${b.siteName} est créé. Vous pouvez dès maintenant publier un besoin ou proposer vos services.</p>
    <p><a href="${b.siteUrl}" style="color:${b.color};">Accéder à ${b.siteName}</a></p>
  `);
}

async function sendPasswordResetEmail(to, resetUrl, brandKey = 'jobber') {
  const b = brand(brandKey);
  await sendBrandedEmail(brandKey, to, `Réinitialisez votre mot de passe ${b.siteName}`, `
    <p>Vous avez demandé la réinitialisation de votre mot de passe ${b.siteName}.</p>
    <p><a href="${resetUrl}" style="color:${b.color};">Cliquez ici pour choisir un nouveau mot de passe</a></p>
    <p>Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  `);
}

async function sendMissionPublishedEmail(to, { firstName, missionTitle, missionId, brandKey = 'jobber' } = {}) {
  const b = brand(brandKey);
  await sendBrandedEmail(brandKey, to, `Votre besoin "${missionTitle}" est publié`, `
    <p>${greeting(firstName)}</p>
    <p>Votre mission <strong>${missionTitle}</strong> est en ligne. Vous recevrez une notification dès qu'un prestataire proposera son offre.</p>
    <p><a href="${b.siteUrl}/missions/${missionId}" style="color:${b.color};">Voir ma mission</a></p>
  `);
}

async function sendAgenceProposalEmail(to, { clientFirstName, missionTitle, total, date, url, brandKey = 'services34' } = {}) {
  const b = brand(brandKey);
  const formattedDate = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  await sendBrandedEmail(brandKey, to, `Votre devis pour "${missionTitle}" est prêt`, `
    <p>${greeting(clientFirstName)}</p>
    <p>Nous avons préparé une proposition pour votre demande <strong>${missionTitle}</strong>, prévue le ${formattedDate}.</p>
    <p><strong>Montant total : ${total} €</strong></p>
    <p><a href="${url}" style="color:${b.color};">Consultez le devis complet et confirmez sur votre compte</a></p>
  `);
}

// Self-contained: given just a booking id, looks up everything it needs
// (mission, client, provider, brand) and emails both parties that the offer
// was accepted. Called fire-and-forget (no await) right after a Booking is
// created, from every place that can happen — errors are caught internally
// so a failed email never affects the booking itself.
async function notifyBookingAccepted(bookingId) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        mission: { select: { title: true, id: true, corporateAgencyId: true } },
        client: { select: { email: true, firstName: true } },
        provider: { select: { email: true, firstName: true } },
      },
    });
    if (!booking) return;

    const brandKey = await resolveBrandKeyForAgencyId(booking.mission.corporateAgencyId);
    const b = brand(brandKey);
    const dateLabel = new Date(booking.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeLabel = new Date(booking.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    await Promise.all([
      sendBrandedEmail(brandKey, booking.client.email, `Mission confirmée : ${booking.mission.title}`, `
        <p>${greeting(booking.client.firstName)}</p>
        <p>Votre mission <strong>${booking.mission.title}</strong> est confirmée avec ${booking.provider.firstName || 'votre jobber'}, le ${dateLabel} à ${timeLabel}.</p>
        <p>Montant : <strong>${booking.totalAmount.toFixed(2)} €</strong></p>
        <p><a href="${b.siteUrl}/account" style="color:${b.color};">Voir ma réservation</a></p>
      `),
      sendBrandedEmail(brandKey, booking.provider.email, `Offre acceptée : ${booking.mission.title}`, `
        <p>${greeting(booking.provider.firstName)}</p>
        <p>Votre offre pour <strong>${booking.mission.title}</strong> a été acceptée${booking.client.firstName ? ` par ${booking.client.firstName}` : ''}.</p>
        <p>Rendez-vous le ${dateLabel} à ${timeLabel}.</p>
        <p><a href="${b.siteUrl}/account" style="color:${b.color};">Voir la mission</a></p>
      `),
    ]);
  } catch (err) {
    console.error('notifyBookingAccepted failed:', err);
  }
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendMissionPublishedEmail,
  sendAgenceProposalEmail,
  notifyBookingAccepted,
  sendBrandedEmail,
};
