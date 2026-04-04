'use strict';

/**
 * requestLogger – Simple HTTP request logger middleware.
 */
const requestLogger = (req, res, next) => {
  const time = new Date().toLocaleTimeString('ro-RO');
  console.log(`[${time}] ${req.method} ${req.url}`);
  next();
};

module.exports = requestLogger;
