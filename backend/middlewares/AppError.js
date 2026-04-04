'use strict';

/**
 * AppError – Operational error with an HTTP status code.
 * Use this for known, expected errors (validation, not found, conflict, etc.)
 * Non-operational errors (bugs, unexpected failures) should be plain Errors.
 */
class AppError extends Error {
  /**
   * @param {string} message – Human-readable error message
   * @param {number} statusCode – HTTP status code (400, 401, 403, 404, 409, etc.)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
