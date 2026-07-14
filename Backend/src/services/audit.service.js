/**
 * Audit service.
 * Logs security-sensitive events for healthcare compliance.
 * Non-blocking — errors are caught silently to avoid failing user requests.
 */
const AuditLog = require('../models/AuditLog');

/**
 * Log an authentication event.
 * @param {Object} params
 * @param {string} params.userId    - User's MongoDB _id (null for failed attempts with unknown user)
 * @param {string} params.action    - Action name (e.g. 'LOGIN', 'LOGOUT')
 * @param {string} params.ip        - Client IP address
 * @param {string} params.userAgent - Client user agent
 * @param {boolean} params.success  - Whether the action succeeded
 * @param {Object} params.metadata  - Additional data (optional)
 */
const logAuthEvent = async ({ userId, action, ip, userAgent, success = true, metadata = {} }) => {
  try {
    await AuditLog.create({
      userId: userId || null,
      action,
      ip: ip || null,
      userAgent: userAgent || null,
      success,
      metadata,
    });
  } catch (error) {
    // Silently log — audit failures should NEVER break user flows
    console.error('Audit log write failed:', error.message);
  }
};

module.exports = { logAuthEvent };
