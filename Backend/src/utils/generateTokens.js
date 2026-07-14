/**
 * Convenience function to generate both access and refresh tokens.
 * Used during login to create a new token pair with a fresh family.
 */
const tokenService = require('../services/token.service');

/**
 * Generate access + refresh token pair, save refresh token to DB.
 * Creates a new token family (since this is used at login time).
 *
 * @param {Object} user       - User document
 * @param {string} ip         - Client IP
 * @param {string} userAgent  - Client user agent
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokens = async (user, ip, userAgent) => {
  const accessToken = tokenService.generateAccessToken(user._id, user.role);
  const rawRefreshToken = tokenService.generateRefreshToken();

  // family = null → creates a new token family
  await tokenService.saveRefreshToken(user._id, rawRefreshToken, ip, userAgent, null);

  return {
    accessToken,
    refreshToken: rawRefreshToken,
  };
};

module.exports = generateTokens;
