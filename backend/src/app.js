const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const categoriesRoutes = require('./routes/categories.routes');
const missionsRoutes = require('./routes/missions.routes');
const offersRoutes = require('./routes/offers.routes');
const bookingsRoutes = require('./routes/bookings.routes');
const paymentsRoutes = require('./routes/payments.routes');
const messagesRoutes = require('./routes/messages.routes');
const reviewsRoutes = require('./routes/reviews.routes');
const verificationRoutes = require('./routes/verification.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();// Vercel assigns a fresh URL to every deployment (previews included), so a
// single exact CLIENT_ORIGIN would break on each redeploy. We allow the
// configured origin(s) (comma-separated, e.g. your final custom domain)
// PLUS any *.vercel.app subdomain.
const allowedOrigins = (process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // server-to-server / curl / health checks
    if (allowedOrigins.includes(origin)) return callback(null, true);
    try {
      if (new URL(origin).hostname.endsWith('.vercel.app')) return callback(null, true);
    } catch { /* ignore malformed origin */ }
    callback(new Error(`Origin non autorisée par CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(morgan('dev'));

// Stripe webhook needs the raw body for signature verification, so it must
// be mounted BEFORE express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentsRoutes.webhookHandler);

app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/missions', missionsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
