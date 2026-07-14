const mongoose = require('mongoose');
const { refreshTokenExpiryMs, bcryptSaltRounds } = require('../config/jwt.config');
const bcrypt = require('bcryptjs');

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

// ─── Static Methods ──────────────────────────────────

/**
 * Save a hashed refresh token for a user.
 */
refreshTokenSchema.statics.saveToken = async function (userId, rawToken, ip, userAgent) {
  const tokenHash = await bcrypt.hash(rawToken, bcryptSaltRounds);

  return this.create({
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + refreshTokenExpiryMs),
    createdByIp: ip || null,
    userAgent: userAgent || null,
  });
};

/**
 * Find and verify a refresh token for a user.
 * Returns the token document if valid, null otherwise.
 */
refreshTokenSchema.statics.verifyToken = async function (userId, candidateToken) {
  const tokens = await this.find({ userId });

  for (const tokenDoc of tokens) {
    const isMatch = await bcrypt.compare(candidateToken, tokenDoc.tokenHash);
    if (isMatch) {
      // Check expiry
      if (tokenDoc.expiresAt < new Date()) {
        await tokenDoc.deleteOne();
        return null;
      }
      return tokenDoc;
    }
  }

  return null;
};

/**
 * Delete a specific token (logout from one device).
 */
refreshTokenSchema.statics.deleteToken = async function (tokenDocId) {
  return this.findByIdAndDelete(tokenDocId);
};

/**
 * Delete all tokens for a user (logout from all devices).
 */
refreshTokenSchema.statics.deleteAllTokens = async function (userId) {
  return this.deleteMany({ userId });
};

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);
