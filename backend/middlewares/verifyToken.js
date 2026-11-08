'use strict';

const AppError = require('./AppError');
const { verifyAuthToken } = require('../services/authService');

/**
 * verifyToken – JWT auth middleware.
 *
 * Expects:  Authorization: Bearer <token issued by /auth/login or /auth/register>
 * Sets:     req.user = { uid, id, email } — `uid` is the users.auth_uid that services look up.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required.', 401));
  }

  try {
    const payload = verifyAuthToken(authHeader.slice('Bearer '.length));
    req.user = { uid: payload.sub, id: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    return next(err);
  }
};

/**
 * optionalToken – like verifyToken, but anonymous requests pass through with req.user unset.
 * A present-but-invalid token is still rejected, so clients notice expired sessions.
 */
const optionalToken = (req, res, next) => {
  if (!req.headers.authorization) return next();
  return verifyToken(req, res, next);
};

module.exports = verifyToken;
module.exports.optionalToken = optionalToken;
