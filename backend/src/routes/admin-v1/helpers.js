const crypto = require('crypto');
const prisma = require('../../config/prisma');
const { verifyToken } = require('../../utils/jwt');
const { ROLE_TEMPLATES } = require('../../admin/permissions');
const { isSuspended } = require('../../admin/restrictions');

// Money is stored as euros (Float) in the existing schema; the admin API
// always answers in integer cents with the currency spelled out.
const cents = (eur) => (eur == null ? null : Math.round(eur * 100));

function httpError(status, message, extra) {
  const e = new Error(message);
  e.status = status; e.expose = true; e.extra = extra;
  return e;
}

// Prisma P2021 = table missing: the admin tables haven't been pushed yet.
function isMissingTable(err) {
  return err?.code === 'P2021' || /does not exist in the current database/.test(err?.message || '');
}

const MIGRATION_HINT = 'Migration requise : exécuter `npx prisma db push` sur le backend pour créer les tables du back-office.';

// Loads the admin identity and permission template, and stamps a
// correlation id every audit event of this request will share.
async function adminContext(req, res, next) {
  req.correlationId = crypto.randomUUID();
  res.set('X-Correlation-Id', req.correlationId);
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw httpError(401, 'Authentification requise');
    let payload;
    try { payload = verifyToken(token); } catch { throw httpError(401, 'Session expirée, reconnectez-vous'); }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    if (!user || user.role !== 'ADMIN') throw httpError(403, 'Accès réservé aux administrateurs Jobber');
    if (await isSuspended(user.id)) throw httpError(403, 'Compte suspendu');

    let access = null;
    let accessTablesReady = true;
    try {
      access = await prisma.adminAccess.findUnique({ where: { userId: user.id } });
    } catch (err) {
      if (!isMissingTable(err)) throw err;
      accessTablesReady = false;
    }
    if (access && !access.active) throw httpError(403, 'Accès administrateur désactivé');
    const roleKey = access?.roleKey && ROLE_TEMPLATES[access.roleKey] ? access.roleKey : 'owner';
    req.admin = {
      user,
      roleKey,
      roleLabel: ROLE_TEMPLATES[roleKey].label,
      permissions: new Set(ROLE_TEMPLATES[roleKey].permissions),
      legacyOwner: !access,
      accessTablesReady,
    };
    next();
  } catch (err) { next(err); }
}

function can(...perms) {
  return (req, res, next) => {
    const missing = perms.filter((p) => !req.admin.permissions.has(p));
    if (missing.length) return next(httpError(403, `Permission manquante : ${missing.join(', ')}`));
    next();
  };
}

// Async route wrapper — turns Zod/Prisma errors into readable answers.
const route = (fn) => async (req, res, next) => {
  try { await fn(req, res, next); } catch (err) {
    if (err.name === 'ZodError') return next(httpError(400, err.errors.map((e) => `${e.path.join('.') || 'requête'} : ${e.message === 'Required' ? 'obligatoire' : e.message}`).join(' ; ')));
    if (isMissingTable(err)) return next(httpError(503, MIGRATION_HINT, { code: 'MIGRATION_REQUIRED' }));
    next(err);
  }
};

const PAGE_SIZES = [25, 50, 100];

function pagination(query) {
  const pageSize = PAGE_SIZES.includes(Number(query.pageSize)) ? Number(query.pageSize) : 25;
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  return { pageSize, page, skip: (page - 1) * pageSize, take: pageSize };
}

// `allowed` maps the API sort key to a Prisma orderBy builder so a client
// can never sort on an arbitrary column.
function sorting(query, allowed, fallback) {
  const [key, dirRaw] = String(query.sort || '').split(':');
  const dir = dirRaw === 'asc' ? 'asc' : 'desc';
  const build = allowed[key] || allowed[fallback];
  return { orderBy: build(dir), sort: `${allowed[key] ? key : fallback}:${allowed[key] ? dir : 'desc'}` };
}

function dateRange(query, field = 'createdAt') {
  const range = {};
  if (query.from) { const d = new Date(query.from); if (!isNaN(d)) range.gte = d; }
  if (query.to) { const d = new Date(query.to); if (!isNaN(d)) { d.setUTCHours(23, 59, 59, 999); range.lte = d; } }
  return Object.keys(range).length ? { [field]: range } : {};
}

// Leading = + - @ (and tab/CR) would run as a formula in Excel/Sheets.
function csvCell(v) {
  if (v == null) return '';
  let s = v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(columns, rows) {
  const head = columns.map((c) => csvCell(c.label)).join(';');
  const body = rows.map((r) => columns.map((c) => csvCell(c.value(r))).join(';'));
  return '﻿' + [head, ...body].join('\r\n');
}

const EXPORT_LIMIT = 5000;

const fullName = (u) => (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email : null);

module.exports = {
  cents, httpError, isMissingTable, MIGRATION_HINT, adminContext, can, route,
  pagination, sorting, dateRange, toCsv, EXPORT_LIMIT, fullName,
};
