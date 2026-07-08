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

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }));
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
