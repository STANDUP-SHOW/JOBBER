const { verifyToken } = require('../utils/jwt');
const { isSuspended } = require('../admin/restrictions');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentification requise' });

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
  req.user = { id: payload.sub, role: payload.role, email: payload.email, accountKind: payload.accountKind };
  // A suspension from the admin back-office applies to tokens already issued.
  isSuspended(payload.sub).then((suspended) => {
    if (suspended) return res.status(403).json({ error: 'Compte suspendu. Contactez le support.' });
    next();
  }, next);
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé pour ce rôle' });
    }
    next();
  };
}

// Decodes the token if present, but never rejects — for public routes that
// personalize their response when the caller happens to be logged in.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = { id: payload.sub, role: payload.role, email: payload.email, accountKind: payload.accountKind };
    } catch (err) {
      // invalid/expired token on a public route — treat as anonymous
    }
  }
  next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
