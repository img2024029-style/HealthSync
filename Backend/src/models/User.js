const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { bcryptSaltRounds, maxLoginAttempts, lockDurationMs } = require('../config/jwt.config');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
        minlength: [2, 'First name must be at least 2 characters'],
        maxlength: [100, 'First name cannot exceed 100 characters'],
      },
      lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
        minlength: [2, 'Last name must be at least 2 characters'],
        maxlength: [100, 'Last name cannot exceed 100 characters'],
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please provide a valid 10-digit mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: ['user'],
      default: 'user',
    },

    // ─── Email Verification ──────────────────────────
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      select: false,
    },
    verificationExpiry: {
      type: Date,
      select: false,
    },

    // ─── Password Reset ──────────────────────────────
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpiry: {
      type: Date,
      select: false,
    },

    // ─── Account Lockout ─────────────────────────────
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── Indexes ───────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

// ─── Pre-save Hook: Hash Password ──────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, bcryptSaltRounds);
  next();
});

// ─── Instance Methods ──────────────────────────────────

/**
 * Compare a candidate password with the stored hash.
 */
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if the account is currently locked.
 */
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Increment login attempts. Lock account after max attempts.
 */
userSchema.methods.incrementLoginAttempts = async function () {
  // If previous lock has expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  // Lock account if we've reached max attempts
  if (this.loginAttempts + 1 >= maxLoginAttempts) {
    updates.$set = { lockUntil: new Date(Date.now() + lockDurationMs) };
  }

  return this.updateOne(updates);
};

/**
 * Reset login attempts after successful login.
 */
userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

/**
 * Remove sensitive fields when converting to JSON.
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.verificationExpiry;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpiry;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
