/**
 * Generate a cryptographically secure random token.
 * Used for email verification and password reset tokens.
 */
const crypto = require('crypto');

const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = generateRandomToken;
