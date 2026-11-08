'use strict';

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter – 200 requests per 15 minutes per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Prea multe cereri. Încearcă din nou peste 15 minute.' },
});

/**
 * Strict limiter for auth/write endpoints – 30 requests per 15 minutes per IP.
 */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Prea multe cereri. Încearcă din nou peste 15 minute.' },
});

/**
 * Upload limiter – 60 images per 15 minutes per IP (a listing can carry several photos).
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads. Try again in 15 minutes.' },
});

module.exports = { generalLimiter, writeLimiter, uploadLimiter };
