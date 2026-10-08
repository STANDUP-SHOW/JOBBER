const prisma = require('../config/prisma');

// Suspended accounts, kept in memory and refreshed at most every 30s so
// requireAuth can turn away a suspended user's still-valid token without a
// database query per request. Fails open (empty set) if the
// AccountRestriction table hasn't been created yet.
const TTL_MS = 30 * 1000;
let cache = { ids: new Set(), at: 0 };
let inflight = null;

async function refresh() {
  try {
    const rows = await prisma.accountRestriction.findMany({ where: { liftedAt: null }, select: { userId: true } });
    cache = { ids: new Set(rows.map((r) => r.userId)), at: Date.now() };
  } catch {
    cache = { ids: new Set(), at: Date.now() };
  }
}

async function isSuspended(userId) {
  if (Date.now() - cache.at > TTL_MS) {
    inflight = inflight || refresh().finally(() => { inflight = null; });
    await inflight;
  }
  return cache.ids.has(userId);
}

function invalidateRestrictions() { cache.at = 0; }

module.exports = { isSuspended, invalidateRestrictions };
