/**
 * Audit service.
 * Logs security-sensitive events for healthcare compliance.
 * Parses user agent into structured browser and device records.
 */
const AuditLog = require('../models/AuditLog');
const UAParser = require('ua-parser-js');

/**
 * Log an authentication/security event.
 */
const logAuthEvent = async ({ userId, action, ip, userAgent, success = true, metadata = {} }) => {
  try {
    let browser = 'Unknown';
    let device = 'Desktop';
    if (userAgent) {
      const parser = new UAParser(userAgent);
      const result = parser.getResult();
      browser = result.browser.name ? `${result.browser.name} ${result.browser.version || ''}`.trim() : 'Unknown';
      device = result.device.type ? result.device.type : 'Desktop';
    }

    await AuditLog.create({
      userId: userId || null,
      action,
      ip: ip || null,
      browser,
      device,
      location: 'Unknown', // Geo-IP mapping can be added here in the future
      success,
      metadata,
    });
  } catch (error) {
    // Silently log — audit failures should NEVER break user flows
    console.error('Audit log write failed:', error.message);
  }
};

module.exports = { logAuthEvent };
