const express = require('express');
const { adminContext } = require('./helpers');

// /api/admin/v1 — the API behind the Jobber Admin Factory desktop app.
// Every route needs an ADMIN account and checks its own permission.
const router = express.Router();
router.use(adminContext);
router.use(require('./system.routes'));
router.use(require('./users.routes'));
router.use(require('./missions.routes').router);
router.use(require('./finance-support.routes'));

router.use((req, res) => res.status(404).json({ error: 'Route admin introuvable' }));

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({
    error: err.expose ? err.message : 'Erreur interne du serveur',
    ...(err.extra || {}),
    correlationId: req.correlationId,
  });
});

module.exports = router;
