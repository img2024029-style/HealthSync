/**
 * RefreshToken model.
 *
 * Key design decisions:
 *   - SHA-256 hashing (not bcrypt) for refresh tokens.
 *     Refresh tokens are high-entropy random strings (40 bytes / 80 hex chars),
 *     so they don't need the brute-force resistance of bcrypt. SHA-256 enables
 *     O(1) indexed lookups instead of O(n) bcrypt.compare() scans.
 *   - Token family tracking for reuse detection.
 *     Each login creates a token "family". When rotated, the new token inherits
 *     the family. If a used token is replayed, ALL family tokens are revoked.
 *   - Used tokens are retained briefly (marked isUsed: true) to detect replay.
 *     TTL index auto-cleans expired tokens.
 */
const mongoose = require('mongoose');
const crypto = require('crypto');
const { refreshTokenExpiryMs } = require('../config/jwt.config');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true, // Indexed for O(1) SHA-256 lookups
    },
    family: {
      type: String,
      required: true,
      index: true, // Indexed for reuse detection (delete all in family)
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + refreshTokenExpiryMs),
      index: { expires: 0 }, // TTL index — MongoDB auto-deletes expired docs
    },
    createdByIp: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Helper: SHA-256 hash ─────────────────────────────

/**
 * Hash a raw token with SHA-256.
 * @param {string} rawToken
 * @returns {string} hex-encoded hash
 */
const sha256 = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

// ─── Static Methods ──────────────────────────────────

/**
 * Create and save a new refresh token.
 * @param {string}  userId   - User's MongoDB _id
 * @param {string}  rawToken - Raw refresh token string
 * @param {string}  ip       - Client IP
 * @param {string}  ua       - Client user agent
 * @param {string?} family   - Token family ID (null = new family from login)
 * @returns {Object} Saved document
 */
refreshTokenSchema.statics.saveToken = async function (userId, rawToken, ip, ua, family) {
  const tokenHash = sha256(rawToken);
  const tokenFamily = family || crypto.randomUUID(); // New family on first login

  return this.create({
    userId,
    tokenHash,
    family: tokenFamily,
    expiresAt: new Date(Date.now() + refreshTokenExpiryMs),
    createdByIp: ip || null,
    userAgent: ua || null,
  });
};

/**
 * Find a token document by its raw value (SHA-256 lookup — O(1)).
 * @param {string} rawToken - Raw refresh token from cookie
 * @returns {Object|null} Token document or null
 */
refreshTokenSchema.statics.findByRawToken = async function (rawToken) {
  const tokenHash = sha256(rawToken);
  return this.findOne({ tokenHash });
};

/**
 * Mark a token as used (for reuse detection during rotation).
 * @param {string} tokenDocId - Token document _id
 */
refreshTokenSchema.statics.markUsed = async function (tokenDocId) {
  return this.findByIdAndUpdate(tokenDocId, { isUsed: true });
};

/**
 * Revoke all tokens in a family (reuse detection response).
 * @param {string} family - Token family ID
 */
refreshTokenSchema.statics.revokeFamily = async function (family) {
  return this.deleteMany({ family });
};

/**
 * Delete a specific token by ID.
 * @param {string} tokenDocId - Token document _id
 */
refreshTokenSchema.statics.deleteToken = async function (tokenDocId) {
  return this.findByIdAndDelete(tokenDocId);
};

/**
 * Delete all tokens for a user (logout from all devices).
 * @param {string} userId - User's MongoDB _id
 */
refreshTokenSchema.statics.deleteAllTokens = async function (userId) {
  return this.deleteMany({ userId });
};

// Export the SHA-256 helper for external use
refreshTokenSchema.statics.hashToken = sha256;

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
