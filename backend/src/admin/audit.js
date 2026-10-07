const prisma = require('../config/prisma');

// Keys whose values never reach the journal, whatever object they sit on.
const SENSITIVE = /password|pin|token|secret|iban|bank|siret|card|fileurl|stripe/i;

function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SENSITIVE.test(k) ? '[expurgé]' : redact(v)]));
  }
  return value;
}

// Only the keys that actually changed, before → after.
function diffOf(before = {}, after = {}) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const out = {};
  for (const k of keys) {
    const b = before[k] instanceof Date ? before[k].toISOString() : before[k];
    const a = after[k] instanceof Date ? after[k].toISOString() : after[k];
    if (JSON.stringify(b) !== JSON.stringify(a)) out[k] = { before: b ?? null, after: a ?? null };
  }
  return redact(out);
}

// `db` lets a caller write the event inside its own transaction, so a
// mutation and its trace commit or roll back together.
function recordAudit(req, { action, permission, objectType, objectId, reason, diff, result = 'SUCCESS' }, db = prisma) {
  return db.auditEvent.create({
    data: {
      actorId: req.admin?.user.id || null,
      actorType: 'HUMAN',
      actorLabel: req.admin ? `${req.admin.user.firstName} ${req.admin.user.lastName}`.trim() : null,
      action,
      permission,
      objectType,
      objectId: objectId || null,
      reason: reason || null,
      diff: diff ? redact(diff) : undefined,
      result,
      correlationId: req.correlationId,
    },
  });
}

module.exports = { recordAudit, diffOf, redact };
