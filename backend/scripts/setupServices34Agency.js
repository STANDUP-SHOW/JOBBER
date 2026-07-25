// One-off: creates (or updates) the Services 34 corporate agency account —
// the User row that owns every mission posted via services34.fr and that
// logs into admin.services34.fr with an identifiant + PIN (not the normal
// email/password flow). Safe to re-run: upserts by email, resets the admin
// login/PIN back to the defaults each time.
// Run once via `node scripts/setupServices34Agency.js`.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const AGENCY_EMAIL = 'agence@services34.fr';
const DEFAULT_ADMIN_LOGIN_ID = 'ADMIN';
const DEFAULT_ADMIN_PIN = '050978';
// Issued by Jobber — not self-editable from the agency's own Paramètres page.
const JOBBER_LICENSE_NUMBER = '2026-07-410';

async function main() {
  const adminPinHash = await bcrypt.hash(DEFAULT_ADMIN_PIN, 10);

  const agency = await prisma.user.upsert({
    where: { email: AGENCY_EMAIL },
    update: {
      adminLoginId: DEFAULT_ADMIN_LOGIN_ID,
      adminPinHash,
      adminPinFailedAttempts: 0,
      adminPinLockedUntil: null,
      agencyDomain: 'services34.fr',
      jobberLicenseNumber: JOBBER_LICENSE_NUMBER,
    },
    create: {
      email: AGENCY_EMAIL,
      firstName: 'Services',
      lastName: '34',
      role: 'MANAGER',
      accountKind: 'COMPANY',
      companyType: 'CORPORATE',
      companyName: 'Services 34',
      isEmailVerified: true,
      serviceRadiusKm: 50,
      agencyDomain: 'services34.fr',
      adminLoginId: DEFAULT_ADMIN_LOGIN_ID,
      adminPinHash,
      jobberLicenseNumber: JOBBER_LICENSE_NUMBER,
    },
  });

  console.log(`Compte agence Services 34 prêt : userId=${agency.id}, identifiant=${DEFAULT_ADMIN_LOGIN_ID}, PIN=${DEFAULT_ADMIN_PIN}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
