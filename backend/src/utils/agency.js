// Shared helpers for the corporate agency back-office (agency-admin.routes.js)
// and for tagging missions at creation time (missions.routes.js).

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

module.exports = { generateCorporateCode, REFUSAL_REASONS_JOBBER };
