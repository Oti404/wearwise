/**
 * config/constants.js
 * Centralized application constants.
 */

const CONSTANTS = {
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
  },
  STATUS_CODES: {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
  },
  CACHE_TTL: {
    SHORT: 300,        // 5 mins
    MEDIUM: 3600,      // 1 hour
    LONG: 86400,       // 24 hours
  }
};

module.exports = CONSTANTS;
