/**
 * Hash a plain-text token using SHA-256.
 * Used for email verification tokens and password reset tokens.
 * (Refresh tokens use bcrypt instead for stronger hashing.)
 */
const crypto = require('crypto');

const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

module.exports = hashToken;
