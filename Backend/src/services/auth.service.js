/**
 * Auth service — core business logic for authentication.
 * Controllers delegate all logic here.
 *
 * Key improvements:
 *   - Refresh tokens use SHA-256 → O(1) lookup (no bcrypt scan)
 *   - Token family tracking with reuse detection
 *   - If a used token is replayed → entire family revoked (theft protection)
 *   - Structured logging via logger utility
 */
const User = require('../models/User');
const tokenService = require('./token.service');
const emailService = require('./email.service');
const auditService = require('./audit.service');
const generateRandomToken = require('../utils/generateRandomToken');
const hashToken = require('../utils/hashToken');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const MESSAGES = require('../constants/messages');
const { verificationTokenExpiryMs, resetTokenExpiryMs } = require('../config/jwt.config');

/**
 * Register a new user.
 */
const register = async (userData, ip, userAgent) => {
  const { firstName, lastName, email, mobileNumber, password } = userData;

  // Check if email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw ApiError.conflict(MESSAGES.USER_ALREADY_EXISTS);
  }

  // Check if mobile number already exists
  const existingMobile = await User.findOne({ mobileNumber });
  if (existingMobile) {
    throw ApiError.conflict(MESSAGES.MOBILE_ALREADY_EXISTS);
  }

  // Generate email verification token
  const verificationRawToken = generateRandomToken();
  const verificationHashedToken = hashToken(verificationRawToken);

  // Create user
  const user = await User.create({
    fullName: { firstName, lastName },
    email,
    mobileNumber,
    password,
    verificationToken: verificationHashedToken,
    verificationExpiry: new Date(Date.now() + verificationTokenExpiryMs),
  });

  // Send verification email (fire-and-forget)
  emailService.sendVerificationEmail(email, verificationRawToken).catch((err) => {
    logger.error('Failed to send verification email', { email, error: err.message });
  });

  // Audit log
  auditService.logAuthEvent({
    userId: user._id,
    action: 'REGISTER',
    ip,
    userAgent,
    success: true,
  });

  logger.info('User registered', { userId: user._id, email });

  return {
    user: user.toJSON(),
    message: MESSAGES.REGISTER_SUCCESS,
  };
};

/**
 * Verify user's email address.
 */
const verifyEmail = async (rawToken) => {
  const hashedToken = hashToken(rawToken);

  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationExpiry: { $gt: Date.now() },
  }).select('+verificationToken +verificationExpiry');

  if (!user) {
    throw ApiError.badRequest(MESSAGES.INVALID_TOKEN);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  // Audit log
  auditService.logAuthEvent({
    userId: user._id,
    action: 'EMAIL_VERIFIED',
    success: true,
  });

  logger.info('Email verified', { userId: user._id });

  return { message: MESSAGES.EMAIL_VERIFIED };
};

/**
 * Login a user.
 */
const login = async (email, password, ip, userAgent) => {
  // Find user with password and lockout fields
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

  if (!user) {
    throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
  }

  // Check if account is locked
  if (user.isLocked()) {
    auditService.logAuthEvent({
      userId: user._id,
      action: 'LOGIN_FAILED',
      ip,
      userAgent,
      success: false,
      metadata: { reason: 'account_locked' },
    });
    throw ApiError.forbidden(MESSAGES.ACCOUNT_LOCKED);
  }

  // Check password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    await user.incrementLoginAttempts();

    // Check if this attempt triggers a lock
    const updatedUser = await User.findById(user._id).select('+loginAttempts +lockUntil');
    if (updatedUser.isLocked()) {
      auditService.logAuthEvent({
        userId: user._id,
        action: 'ACCOUNT_LOCKED',
        ip,
        userAgent,
        success: false,
        metadata: { loginAttempts: updatedUser.loginAttempts },
      });
      logger.warn('Account locked due to failed attempts', { userId: user._id, ip });
    }

    auditService.logAuthEvent({
      userId: user._id,
      action: 'LOGIN_FAILED',
      ip,
      userAgent,
      success: false,
      metadata: { reason: 'invalid_password' },
    });

    throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
  }

  // Check if email is verified
  if (!user.isVerified) {
    throw ApiError.forbidden(MESSAGES.EMAIL_NOT_VERIFIED);
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Generate tokens — new family created on login
  const accessToken = tokenService.generateAccessToken(user._id, user.role);
  const refreshTokenRaw = tokenService.generateRefreshToken();

  // Save refresh token (new family, since this is a fresh login)
  await tokenService.saveRefreshToken(user._id, refreshTokenRaw, ip, userAgent);

  // Audit log
  auditService.logAuthEvent({
    userId: user._id,
    action: 'LOGIN',
    ip,
    userAgent,
    success: true,
  });

  logger.info('User logged in', { userId: user._id, ip });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken: refreshTokenRaw,
  };
};

/**
 * Refresh the access token using a valid refresh token.
 * Implements refresh token rotation with reuse detection.
 *
 * Flow:
 *   1. SHA-256 hash the raw token → O(1) indexed lookup
 *   2. If no match found → invalid token (401)
 *   3. If token is marked "isUsed" → REUSE DETECTED
 *      → Revoke entire token family (all sessions in that lineage)
 *      → This means an attacker who stole an old token AND the real user
 *        who already rotated both lose access — forcing re-login
 *   4. If token is active → mark as used, create new token in same family
 */
const refresh = async (refreshTokenRaw, ip, userAgent) => {
  if (!refreshTokenRaw) {
    throw ApiError.unauthorized(MESSAGES.NO_REFRESH_TOKEN);
  }

  // O(1) lookup using SHA-256 hash + index
  const tokenDoc = await tokenService.findRefreshToken(refreshTokenRaw);

  if (!tokenDoc) {
    // Token not found at all — either invalid or already cleaned up
    logger.warn('Refresh attempted with unknown token', { ip });
    throw ApiError.unauthorized(MESSAGES.INVALID_TOKEN);
  }

  // ── REUSE DETECTION ──────────────────────────────────
  // If this token was already used (rotated), someone is replaying it.
  // This indicates potential token theft — revoke the entire family.
  if (tokenDoc.isUsed) {
    logger.warn('SECURITY: Refresh token reuse detected! Revoking token family.', {
      userId: tokenDoc.userId,
      family: tokenDoc.family,
      ip,
      userAgent,
    });

    // Revoke ALL tokens in this family
    await tokenService.revokeFamilyTokens(tokenDoc.family);

    // Audit log with security flag
    auditService.logAuthEvent({
      userId: tokenDoc.userId,
      action: 'TOKEN_REFRESH',
      ip,
      userAgent,
      success: false,
      metadata: { reason: 'token_reuse_detected', family: tokenDoc.family },
    });

    throw ApiError.unauthorized('Suspicious activity detected. Please log in again.');
  }

  // Check expiry
  if (tokenDoc.expiresAt < new Date()) {
    const RefreshToken = require('../models/RefreshToken');
    await RefreshToken.deleteToken(tokenDoc._id);
    throw ApiError.unauthorized(MESSAGES.REFRESH_TOKEN_EXPIRED);
  }

  const userId = tokenDoc.userId;

  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    const RefreshToken = require('../models/RefreshToken');
    await RefreshToken.deleteToken(tokenDoc._id);
    throw ApiError.unauthorized(MESSAGES.USER_NOT_FOUND);
  }

  // Rotate: mark old as used, generate new token in same family
  const { rawToken: newRefreshToken } = await tokenService.rotateRefreshToken(
    tokenDoc,
    ip,
    userAgent
  );

  // Generate new access token
  const accessToken = tokenService.generateAccessToken(userId, user.role);

  // Audit log
  auditService.logAuthEvent({
    userId,
    action: 'TOKEN_REFRESH',
    ip,
    userAgent,
    success: true,
  });

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout — delete all refresh tokens for the user and clear cookie.
 */
const logout = async (userId, ip, userAgent) => {
  await tokenService.deleteAllRefreshTokens(userId);

  // Audit log
  auditService.logAuthEvent({
    userId,
    action: 'LOGOUT',
    ip,
    userAgent,
    success: true,
  });

  logger.info('User logged out', { userId, ip });

  return { message: MESSAGES.LOGOUT_SUCCESS };
};

/**
 * Forgot password — generate reset token and send email.
 */
const forgotPassword = async (email, ip, userAgent) => {
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal whether the email exists (security best practice)
    return { message: MESSAGES.PASSWORD_RESET_SENT };
  }

  // Generate reset token
  const resetRawToken = generateRandomToken();
  const resetHashedToken = hashToken(resetRawToken);

  user.resetPasswordToken = resetHashedToken;
  user.resetPasswordExpiry = new Date(Date.now() + resetTokenExpiryMs);
  await user.save({ validateBeforeSave: false });

  // Send reset email
  await emailService.sendPasswordResetEmail(email, resetRawToken);

  // Audit log
  auditService.logAuthEvent({
    userId: user._id,
    action: 'PASSWORD_RESET_REQUESTED',
    ip,
    userAgent,
    success: true,
  });

  logger.info('Password reset requested', { userId: user._id, email });

  return { message: MESSAGES.PASSWORD_RESET_SENT };
};

/**
 * Reset password using a valid reset token.
 */
const resetPassword = async (rawToken, newPassword, ip, userAgent) => {
  const hashedToken = hashToken(rawToken);

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpiry');

  if (!user) {
    throw ApiError.badRequest(MESSAGES.INVALID_TOKEN);
  }

  // Update password (pre-save hook will hash it)
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  // Also reset login attempts in case account was locked
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  // Invalidate all refresh tokens (force re-login on all devices)
  await tokenService.deleteAllRefreshTokens(user._id);

  // Audit log
  auditService.logAuthEvent({
    userId: user._id,
    action: 'PASSWORD_RESET_COMPLETED',
    ip,
    userAgent,
    success: true,
  });

  logger.info('Password reset completed', { userId: user._id });

  return { message: MESSAGES.PASSWORD_RESET_SUCCESS };
};

/**
 * Get current user profile.
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw ApiError.notFound(MESSAGES.USER_NOT_FOUND);
  }

  return { user: user.toJSON() };
};

module.exports = {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
