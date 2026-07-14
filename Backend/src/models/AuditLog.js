const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'REGISTER',
        'LOGIN',
        'LOGIN_FAILED',
        'LOGOUT',
        'TOKEN_REFRESH',
        'EMAIL_VERIFIED',
        'PASSWORD_CHANGED',
        'PASSWORD_RESET_REQUESTED',
        'PASSWORD_RESET_COMPLETED',
        'ACCOUNT_LOCKED',
        'ACCOUNT_UNLOCKED',
      ],
      index: true,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    success: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying by user + action
auditLogSchema.index({ userId: 1, action: 1 });
// Index for time-based queries
auditLogSchema.index({ createdAt: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
