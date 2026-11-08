'use strict';

// This must be the FIRST require – patches async errors globally
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const corsOptions = require('./config/corsOptions');
const { generalLimiter } = require('./config/rateLimit');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./middlewares/AppError');
const { uploadDir } = require('./config/storage');

// Route modules
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const clothesRoutes = require('./routes/clothesRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const followRoutes = require('./routes/followRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Behind nginx (and Caddy in production) every request would otherwise come from the proxy's IP,
// making the rate limiters global. TRUST_PROXY = number of proxy hops in front of the backend.
app.set('trust proxy', Number(process.env.TRUST_PROXY) || false);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));

// ── Uploaded images ───────────────────────────────────────────────────────────
// Mounted before rate limiting and logging: a single feed page loads many images.
// Files have random immutable names, so they can be cached aggressively.
app.use('/uploads', (req, res, next) => {
  // helmet defaults to same-origin; the frontend lives on another origin and must be able to load images.
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadDir, { index: false, dotfiles: 'ignore', immutable: true, maxAge: '30d' }));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(generalLimiter);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/uploads', uploadRoutes);
app.use('/', userRoutes);
app.use('/', clothesRoutes);
app.use('/', checkoutRoutes);
app.use('/', notificationRoutes);
app.use('/', ratingRoutes);
app.use('/', aiRoutes);
app.use('/follows', followRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.url} does not exist.`, 404));
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
