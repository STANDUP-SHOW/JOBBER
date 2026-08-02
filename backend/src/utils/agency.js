// Shared helpers for the corporate agency back-office (agency-admin.routes.js)
// and for tagging missions at creation time (missions.routes.js).
const prisma = require('../config/prisma');

// A corporate agency's own white-label site (e.g. services34.fr) is
// identified by the request's Origin — never trusted from the request body,
// so one white-label site can never spoof another's data. Used both to
// attribute a new Mission to its originating agency, and to route a "Nous
// contacter" submission into that agency's own inbox instead of Jobber's.
async function resolveAgencyFromOrigin(req) {
  const originHost = (() => {
    try { return new URL(req.headers.origin || req.headers.referer || '').hostname.replace(/^www\./, ''); } catch { return null; }
  })();
  if (!originHost) return null;
  return prisma.user.findFirst({
    where: { companyType: 'CORPORATE', OR: [{ agencyDomain: originHost }, { agencyDomain: `www.${originHost}` }] },
    select: { id: true },
  });
}

// "XX-AAAA-MM-123XX" — 2-letter category code, year, month, 3 random digits
// + 2 random letters. Generated once, on creation, only for missions
// submitted through a corporate agency's site.
function generateCorporateCode(categoryName) {
  const stripped = (categoryName || 'XX').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');
  const prefix = (stripped.slice(0, 2) || 'XX').padEnd(2, 'X');
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const digits = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const randomLetters = Array.from({ length: 2 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join('');
  return `${prefix}-${year}-${month}-${digits}${randomLetters}`;
}

const REFUSAL_REASONS_JOBBER = [
  "Indisponible à la date/l'heure proposée",
  'Tarif proposé trop bas',
  "Trop éloigné de mon secteur d'intervention",
  'Ne correspond pas à mes compétences/catégorie',
  'Matériel/véhicule requis non disponible',
  'Planning déjà complet',
  'Autre',
];

module.exports = { generateCorporateCode, REFUSAL_REASONS_JOBBER, resolveAgencyFromOrigin };
