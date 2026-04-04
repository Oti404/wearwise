/**
 * utils/logger.js
 * Centralized structured logger (winston).
 * Usage: const logger = require('../utils/logger');
 *        logger.info('message', { meta });
 *        logger.error('message', { err });
 */

const { createLogger, format, transports } = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, simple } = format;

const isProduction = process.env.NODE_ENV === 'production';

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'warn' : 'debug'),
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    json()
  ),
  defaultMeta: { service: 'wearwise-backend' },
  transports: [
    // Always write errors to a dedicated file
    new transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5 MB
      maxFiles: 5,
    }),
    // Combined log for everything
    new transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 10,
    }),
  ],
});

// Pretty console output in development
if (!isProduction) {
  logger.add(
    new transports.Console({
      format: combine(colorize(), simple()),
    })
  );
}

module.exports = logger;
