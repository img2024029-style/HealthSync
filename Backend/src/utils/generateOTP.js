/**
 * Generate a 6-digit OTP using cryptographically secure random numbers.
 */
const crypto = require('crypto');

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = generateOTP;
