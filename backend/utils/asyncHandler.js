/**
 * utils/asyncHandler.js
 * Wraps async route handlers so uncaught promise rejections
 * are forwarded to Express's next(err) error handler automatically.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 */

/**
 * @param {Function} fn  Async express route handler
 * @returns {Function}   Wrapped handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
