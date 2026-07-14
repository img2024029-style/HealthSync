/**
 * Token service.
 * Handles JWT access tokens and refresh token lifecycle.
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const { accessTokenExpiry } = require('../config/jwt.config');

/**
 * Generate a signed JWT access token.
 * @param {string} userId - User's MongoDB _id
 * @param {string} role   - User's role
 * @returns {string} Signed JWT
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: accessTokenExpiry }
  );
};

/**
 * Generate a cryptographically secure refresh token (raw string).
 * @returns {string} Random hex string
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Verify and decode a JWT access token.
 * @param {string} token - JWT string
 * @returns {Object} Decoded payload
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
};

/**
 * Save a hashed refresh token to the database.
 * @param {string} userId     - User's MongoDB _id
 * @param {string} rawToken   - Raw refresh token string
 * @param {string} ip         - Client IP address
 * @param {string} userAgent  - Client user agent
 * @returns {Object} Saved RefreshToken document
 */
const saveRefreshToken = async (userId, rawToken, ip, userAgent) => {
  return RefreshToken.saveToken(userId, rawToken, ip, userAgent);
};

/**
 * Verify a raw refresh token against stored hashes for a user.
 * @param {string} userId         - User's MongoDB _id
 * @param {string} candidateToken - Raw refresh token from cookie
 * @returns {Object|null} Token document if valid, null otherwise
 */
const verifyRefreshToken = async (userId, candidateToken) => {
  return RefreshToken.verifyToken(userId, candidateToken);
};

/**
 * Rotate a refresh token: delete old, generate and save new.
 * @param {string} userId      - User's MongoDB _id
 * @param {string} tokenDocId  - Old token document _id
 * @param {string} ip          - Client IP
 * @param {string} userAgent   - Client user agent
 * @returns {{ rawToken: string, tokenDoc: Object }}
 */
const rotateRefreshToken = async (userId, tokenDocId, ip, userAgent) => {
  // Delete old token
  await RefreshToken.deleteToken(tokenDocId);

  // Generate and save new token
  const rawToken = generateRefreshToken();
  const tokenDoc = await saveRefreshToken(userId, rawToken, ip, userAgent);

  return { rawToken, tokenDoc };
};

/**
 * Delete all refresh tokens for a user (logout from all devices).
 */
const deleteAllRefreshTokens = async (userId) => {
  return RefreshToken.deleteAllTokens(userId);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  saveRefreshToken,
  verifyRefreshToken,
  rotateRefreshToken,
  deleteAllRefreshTokens,
};
