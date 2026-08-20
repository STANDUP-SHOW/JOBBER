// One-off: creates (or updates) the Mecanow corporate agency account — same
// pattern as setupServices34Agency.js. The User row that owns every mission
// posted via mecanow.fr and that logs into admin.mecanow.fr with an
// identifiant + PIN (not the normal email/password flow). Safe to re-run:
// upserts by email, resets the admin login/PIN back to the defaults each
// time.
// Run once via `node scripts/setupMecanowAgency.js`.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const AGENCY_EMAIL = 'agence@mecanow.fr';
const DEFAULT_ADMIN_LOGIN_ID = 'ADMIN';
const DEFAULT_ADMIN_PIN = '920138';
// Placeholder — issued by Jobber, replace with the real license number
// before going live. Not self-editable from the agency's own Paramètres page.
const JOBBER_LICENSE_NUMBER = '2026-08-414';

async function main() {
  const adminPinHash = await bcrypt.hash(DEFAULT_ADMIN_PIN, 10);

  const agency = await prisma.user.upsert({
    where: { email: AGENCY_EMAIL },
    update: {
      adminLoginId: DEFAULT_ADMIN_LOGIN_ID,
      adminPinHash,
      adminPinFailedAttempts: 0,
      adminPinLockedUntil: null,
      agencyDomain: 'mecanow.fr',
      jobberLicenseNumber: JOBBER_LICENSE_NUMBER,
    },
    create: {
      email: AGENCY_EMAIL,
      firstName: 'Mecanow',
      lastName: '',
      role: 'MANAGER',
      accountKind: 'COMPANY',
      companyType: 'CORPORATE',
      companyName: 'Mecanow',
      isEmailVerified: true,
      serviceRadiusKm: 50,
      agencyDomain: 'mecanow.fr',
      adminLoginId: DEFAULT_ADMIN_LOGIN_ID,
      adminPinHash,
      jobberLicenseNumber: JOBBER_LICENSE_NUMBER,
    },
  });

  console.log(`Compte agence Mecanow prêt : userId=${agency.id}, identifiant=${DEFAULT_ADMIN_LOGIN_ID}, PIN=${DEFAULT_ADMIN_PIN}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
