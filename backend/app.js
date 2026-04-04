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

// Route modules
const userRoutes = require('./routes/userRoutes');
const clothesRoutes = require('./routes/clothesRoutes');
const checkoutRoutes = require('./routes/checkoutRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const aiRoutes = require('./routes/aiRoutes');
const followRoutes = require('./routes/followRoutes');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(generalLimiter);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/ping', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/', userRoutes);
app.use('/', clothesRoutes);
app.use('/', checkoutRoutes);
app.use('/', notificationRoutes);
app.use('/', ratingRoutes);
app.use('/', aiRoutes);
app.use('/', followRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.url} nu există.`, 404));
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

module.exports = app;
