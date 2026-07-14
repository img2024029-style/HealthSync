/**
 * Convenience function to generate both access and refresh tokens.
 */
const tokenService = require('../services/token.service');

/**
 * Generate access + refresh token pair, save refresh token to DB.
 * @param {Object} user       - User document
 * @param {string} ip         - Client IP
 * @param {string} userAgent  - Client user agent
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const generateTokens = async (user, ip, userAgent) => {
  const accessToken = tokenService.generateAccessToken(user._id, user.role);
  const rawRefreshToken = tokenService.generateRefreshToken();

  await tokenService.saveRefreshToken(user._id, rawRefreshToken, ip, userAgent);

  return {
    accessToken,
    refreshToken: rawRefreshToken,
  };
};

module.exports = generateTokens;
