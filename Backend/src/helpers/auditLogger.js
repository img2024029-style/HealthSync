const auditService = require('../services/audit.service');

/**
 * Extract client IP and user agent from the request.
 * @param {Object} req - Express request object
 * @returns {{ ip: string, userAgent: string }}
 */
const getClientInfo = (req) => ({
  ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
  userAgent: req.headers['user-agent'] || null,
});

/**
 * Log an audit event from a controller.
 * @param {Object} req     - Express request
 * @param {string} userId  - User ID
 * @param {string} action  - Audit action
 * @param {boolean} success - Whether action succeeded
 * @param {Object} metadata - Additional metadata
 */
const logFromRequest = (req, userId, action, success = true, metadata = {}) => {
  const { ip, userAgent } = getClientInfo(req);
  auditService.logAuthEvent({ userId, action, ip, userAgent, success, metadata });
};

module.exports = { getClientInfo, logFromRequest };