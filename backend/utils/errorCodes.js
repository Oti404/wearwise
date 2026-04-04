/**
 * utils/errorCodes.js
 * Domain-specific error codes for easier debugging and frontend mapping.
 */

const ERROR_CODES = {
  // Auth Errors
  AUTH_INVALID_TOKEN: 'AUTH_001',
  AUTH_MISSING_TOKEN: 'AUTH_002',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_003',

  // Validation Errors
  VALIDATION_FAILED: 'VAL_001',
  MISSING_REQUIRED_FIELDS: 'VAL_002',

  // Resource Errors
  RESOURCE_NOT_FOUND: 'RES_001',
  RESOURCE_ALREADY_EXISTS: 'RES_002',

  // AI Errors
  AI_MODEL_FAILURE: 'AI_001',
  AI_INVALID_INPUT_TYPE: 'AI_002',

  // System Errors
  INTERNAL_SERVER_ERROR: 'SYS_001',
  SERVICE_UNAVAILABLE: 'SYS_002',
};

module.exports = ERROR_CODES;
