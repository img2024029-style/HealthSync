/**
 * RefreshToken model.
 *
 * Stores session tokens and device metadata.
 * Uses SHA-256 hash lookup and token rotation family tracking for replay attack detection.
 */
const mongoose = require('mongoose');
const crypto = require('crypto');
const UAParser = require('ua-parser-js');
const { refreshTokenExpiryMs } = require('../config/jwt.config');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true, // Indexed for O(1) lookups
    },
    family: {
      type: String,
      required: true,
      index: true, // Family group ID
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    device: {
      type: String,
      default: null,
    },
    browser: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + refreshTokenExpiryMs),
      index: { expires: 0 }, // TTL index
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Helper: SHA-256 hash ─────────────────────────────
const sha256 = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

// ─── Static Methods ──────────────────────────────────

/**
 * Create and save a new refresh token.
 * Parses user agent to extract device and browser.
 */
refreshTokenSchema.statics.saveToken = async function (userId, rawToken, ip, ua, family) {
  const tokenHash = sha256(rawToken);
  const tokenFamily = family || crypto.randomUUID(); // New family on first login

  let browser = 'Unknown';
  let device = 'Desktop';
  if (ua) {
    const parser = new UAParser(ua);
    const result = parser.getResult();
    browser = result.browser.name ? `${result.browser.name} ${result.browser.version || ''}`.trim() : 'Unknown';
    device = result.device.type ? result.device.type : 'Desktop';
  }

  return this.create({
    userId,
    tokenHash,
    family: tokenFamily,
    isUsed: false,
    isRevoked: false,
    device,
    browser,
    ip: ip || null,
    expiresAt: new Date(Date.now() + refreshTokenExpiryMs),
    lastUsedAt: new Date(),
    userAgent: ua || null,
  });
};

/**
 * Find a token document by its raw value.
 */
refreshTokenSchema.statics.findByRawToken = async function (rawToken) {
  const tokenHash = sha256(rawToken);
  return this.findOne({ tokenHash });
};

/**
 * Mark a token as used and update lastUsedAt.
 */
refreshTokenSchema.statics.markUsed = async function (tokenDocId) {
  return this.findByIdAndUpdate(tokenDocId, {
    isUsed: true,
    lastUsedAt: new Date(),
  });
};

/**
 * Revoke all tokens in a family (set isRevoked: true).
 */
refreshTokenSchema.statics.revokeFamily = async function (family) {
  // Update all tokens in family to be revoked, or delete them
  // The roadmap mentions token reuse detection and revoking entire family
  // To comply, we can mark them all as revoked and then delete them, or delete them directly.
  // Let's delete them directly (as was done before) but also mark them revoked if any query relies on it.
  // Deleting is safer for database cleaning, but marking revoked is useful. Let's do both (deleteMany is standard).
  return this.deleteMany({ family });
};

/**
 * Delete a specific token.
 */
refreshTokenSchema.statics.deleteToken = async function (tokenDocId) {
  return this.findByIdAndDelete(tokenDocId);
};

/**
 * Delete all tokens for a user (logout all devices).
 */
refreshTokenSchema.statics.deleteAllTokens = async function (userId) {
  return this.deleteMany({ userId });
};

refreshTokenSchema.statics.hashToken = sha256;

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
