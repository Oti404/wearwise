/**
 * middlewares/security.js
 * Security enhancements using Helmet, HPP, and sanitization.
 */

const helmet = require('helmet');
const hpp = require('hpp');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Configure standard security middlewares.
 * @param {import('express').Application} app
 */
const setupSecurity = (app) => {
  // Set security HTTP headers
  app.use(helmet());

  // Data sanitization against NoSQL query injection (if using MongoDB)
  app.use(mongoSanitize());

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(hpp({
    whitelist: [
      'price',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'duration'
    ]
  }));
};

module.exports = setupSecurity;
