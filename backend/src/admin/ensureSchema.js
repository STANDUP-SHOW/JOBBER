const prisma = require('../config/prisma');

// Creates the four admin tables at startup if they are missing, so a deploy
// is enough and nobody has to run `prisma db push` by hand on Railway. The
// DDL is what `prisma migrate diff` generates for these models, made
// idempotent. It only ever creates; it never alters or drops anything, and
// these tables have no foreign keys to existing ones.
const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "AdminAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleKey" TEXT NOT NULL,
    "scope" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AdminAccess_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'HUMAN',
    "actorLabel" TEXT,
    "action" TEXT NOT NULL,
    "permission" TEXT,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT,
    "reason" TEXT,
    "diff" JSONB,
    "result" TEXT NOT NULL DEFAULT 'SUCCESS',
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "AdminNote" (
    "id" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminNote_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE TABLE IF NOT EXISTS "AccountRestriction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liftedAt" TIMESTAMP(3),
    "liftedById" TEXT,
    "liftReason" TEXT,
    CONSTRAINT "AccountRestriction_pkey" PRIMARY KEY ("id")
  )`,
  'CREATE UNIQUE INDEX IF NOT EXISTS "AdminAccess_userId_key" ON "AdminAccess"("userId")',
  'CREATE INDEX IF NOT EXISTS "AuditEvent_objectType_objectId_idx" ON "AuditEvent"("objectType", "objectId")',
  'CREATE INDEX IF NOT EXISTS "AuditEvent_actorId_createdAt_idx" ON "AuditEvent"("actorId", "createdAt")',
  'CREATE INDEX IF NOT EXISTS "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt")',
  'CREATE INDEX IF NOT EXISTS "AdminNote_objectType_objectId_idx" ON "AdminNote"("objectType", "objectId")',
  'CREATE INDEX IF NOT EXISTS "AccountRestriction_userId_liftedAt_idx" ON "AccountRestriction"("userId", "liftedAt")',
];

// Never throws: on failure the admin routes keep answering 503
// MIGRATION_REQUIRED and the rest of the API is unaffected.
async function ensureAdminSchema() {
  try {
    for (const sql of STATEMENTS) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('Admin schema ready');
  } catch (err) {
    console.error('Admin schema bootstrap failed:', err.message);
  }
}

module.exports = { ensureAdminSchema };
