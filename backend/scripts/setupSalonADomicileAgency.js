// One-off: creates (or updates) the Salon à Domicile corporate agency
// account — same pattern as setupServices34Agency.js. The User row that
// owns every mission posted via salonadomicile.com and that logs into
// admin.salonadomicile.com with an identifiant + PIN (not the normal
// email/password flow). Safe to re-run: upserts by email, resets the admin
// login/PIN back to the defaults each time.
// Run once via `node scripts/setupSalonADomicileAgency.js`.
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

const AGENCY_EMAIL = 'agence@salonadomicile.com';
const DEFAULT_ADMIN_LOGIN_ID = 'ADMIN';
const DEFAULT_ADMIN_PIN = '385647';
// Placeholder — issued by Jobber, replace with the real license number
// before going live. Not self-editable from the agency's own Paramètres page.
const JOBBER_LICENSE_NUMBER = '2026-08-413';

async function main() {
  const adminPinHash = await bcrypt.hash(DEFAULT_ADMIN_PIN, 10);

  const agency = await prisma.user.upsert({
    where: { email: AGENCY_EMAIL },
    update: {
      adminLoginId: DEFAULT_ADMIN_LOGIN_ID,
      adminPinHash,
      adminPinFailedAttempts: 0,
      adminPinLockedUntil: null,
      agencyDomain: 'salonadomicile.com',
      jobberLicenseNumber: JOBBER_LICENSE_NUMBER,
    },
    create: {
      email: AGENCY_EMAIL,
      firstName: 'Salon à Domicile',
      lastName: '',
      role: 'MANAGER',
      accountKind: 'COMPANY',
      companyType: 'CORPORATE',
      companyName: 'Salon à Domicile',
      isEmailVerified: true,
      serviceRadiusKm: 50,
      agencyDomain: 'salonadomicile.com',
      adminLoginId: DEFAULT_ADMIN_LOGIN_ID,
      adminPinHash,
      jobberLicenseNumber: JOBBER_LICENSE_NUMBER,
    },
  });

  console.log(`Compte agence Salon à Domicile prêt : userId=${agency.id}, identifiant=${DEFAULT_ADMIN_LOGIN_ID}, PIN=${DEFAULT_ADMIN_PIN}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
