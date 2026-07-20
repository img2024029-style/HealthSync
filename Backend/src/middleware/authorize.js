/**
 * Role-based authorization middleware.
 * Must be used AFTER the authenticate middleware (which sets req.user).
 *
 * Usage:
 *   router.get('/route', authenticate, authorize('user'), handler);
 *   router.get('/route', authenticate, authorize('user', 'admin'), handler);
 */
const ApiError = require('../utils/ApiError');
const MESSAGES = require('../constants/messages');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden(MESSAGES.FORBIDDEN);
    }
    next();
  };
};

module.exports = authorize;
