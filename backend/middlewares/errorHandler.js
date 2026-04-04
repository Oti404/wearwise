'use strict';

/**
 * Global error handler – must be registered LAST in app.js.
 *
 * Distinguishes between operational errors (AppError) and
 * unexpected bugs (plain Error), returning appropriate JSON.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Default to 500 Internal Server Error
  err.statusCode = err.statusCode || 500;

  if (err.isOperational) {
    // Known, expected error – send safe details to client
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Unexpected bug – log full error, send generic message
  console.error('💥 UNEXPECTED ERROR:', err);

  return res.status(500).json({
    status: 'error',
    message: 'A apărut o eroare internă. Încearcă din nou.',
  });
};

module.exports = errorHandler;
