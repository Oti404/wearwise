'use strict';

/**
 * Auth configuration. Fails fast at startup so the server never runs
 * with a missing or guessable signing key.
 */

const MIN_SECRET_LENGTH = 32;

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < MIN_SECRET_LENGTH) {
  throw new Error(`JWT_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters long.`);
}

module.exports = {
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtAlgorithm: 'HS256',
  bcryptCost: 12,
};
