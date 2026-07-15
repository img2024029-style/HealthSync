/**
 * Token service.
 * Handles JWT access tokens and refresh token lifecycle.
 *
 * Refresh tokens use SHA-256 hashing (not bcrypt) because:
 *   - Tokens are high-entropy (40 random bytes) → no brute-force risk
 *   - SHA-256 enables O(1) indexed database lookups
 *   - bcrypt is designed for low-entropy passwords, not random tokens
 *
 * Supports:
 *   - Multiple refresh tokens per user (multi-device)
 *   - Token family tracking for reuse detection
 *   - Rotation with replay attack prevention
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
    {
      sub: userId,
      role,
      type: 'access',
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: accessTokenExpiry }
  );
};

/**
 * Generate a cryptographically secure refresh token (raw string).
 * 32 bytes = 256 bits = 64 hex characters.
 * @returns {string} Random hex string
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('hex');
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
 * Save a new refresh token to the database.
 * Creates a new token family if no family is provided (e.g., on login).
 *
 * @param {string}  userId    - User's MongoDB _id
 * @param {string}  rawToken  - Raw refresh token string
 * @param {string}  ip        - Client IP address
 * @param {string}  userAgent - Client user agent
 * @param {string?} family    - Token family ID (null = new family)
 * @returns {Object} Saved RefreshToken document
 */
const saveRefreshToken = async (userId, rawToken, ip, userAgent, family = null) => {
  return RefreshToken.saveToken(userId, rawToken, ip, userAgent, family);
};

/**
 * Find a refresh token by its raw value.
 * Uses SHA-256 hash for O(1) indexed lookup (no scanning).
 *
 * @param {string} rawToken - Raw refresh token from cookie
 * @returns {Object|null} Token document if found, null otherwise
 */
const findRefreshToken = async (rawToken) => {
  return RefreshToken.findByRawToken(rawToken);
};

/**
 * Rotate a refresh token with reuse detection.
 *
 * Flow:
 *   1. Find the token by SHA-256 hash (O(1))
 *   2. If token is marked "used" → REUSE DETECTED → revoke entire family
 *   3. If token is active → mark as used, generate new token in same family
 *
 * @param {Object} tokenDoc   - The matched token document
 * @param {string} ip         - Client IP
 * @param {string} userAgent  - Client user agent
 * @returns {{ rawToken: string, tokenDoc: Object }} New token pair
 */
const rotateRefreshToken = async (tokenDoc, ip, userAgent) => {
  // Mark old token as used (instead of deleting — enables reuse detection)
  await RefreshToken.markUsed(tokenDoc._id);

  // Generate and save new token in the same family
  const rawToken = generateRefreshToken();
  const newTokenDoc = await saveRefreshToken(
    tokenDoc.userId,
    rawToken,
    ip,
    userAgent,
    tokenDoc.family // Inherit family
  );

  return { rawToken, tokenDoc: newTokenDoc };
};

/**
 * Revoke all tokens in a token family.
 * Called when token reuse is detected (potential theft).
 *
 * @param {string} family - Token family ID
 */
const revokeFamilyTokens = async (family) => {
  return RefreshToken.revokeFamily(family);
};

/**
 * Delete all refresh tokens for a user (logout from all devices).
 * @param {string} userId - User's MongoDB _id
 */
const deleteAllRefreshTokens = async (userId) => {
  return RefreshToken.deleteAllTokens(userId);
};

/**
 * Delete a specific refresh token by its raw value.
 * @param {string} rawToken - Raw refresh token string
 */
const deleteRefreshToken = async (rawToken) => {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return RefreshToken.deleteOne({ tokenHash });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  saveRefreshToken,
  findRefreshToken,
  rotateRefreshToken,
  revokeFamilyTokens,
  deleteAllRefreshTokens,
  deleteRefreshToken,
};
