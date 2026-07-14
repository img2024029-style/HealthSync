/**
 * Auth service — core business logic for authentication.
 * Controllers delegate all logic here.
 */
const User = require('../models/User');
const tokenService = require('./token.service');
const emailService = require('./email.service');
const auditService = require('./audit.service');
const generateRandomToken = require('../utils/generateRandomToken');
const hashToken = require('../utils/hashToken');
const ApiError = require('../utils/ApiError');
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
    console.error('Failed to send verification email:', err.message);
  });

  // Audit log
  auditService.logAuthEvent({
    userId: user._id,
    action: 'REGISTER',
    ip,
    userAgent,
    success: true,
  });

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
    // Audit log
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
    }

    // Audit log
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

  // Generate tokens
  const accessToken = tokenService.generateAccessToken(user._id, user.role);
  const refreshTokenRaw = tokenService.generateRefreshToken();

  // Save hashed refresh token to DB
  await tokenService.saveRefreshToken(user._id, refreshTokenRaw, ip, userAgent);

  // Audit log
  auditService.logAuthEvent({
    userId: user._id,
    action: 'LOGIN',
    ip,
    userAgent,
    success: true,
  });

  return {
    user: user.toJSON(),
    accessToken,
    refreshToken: refreshTokenRaw,
  };
};

/**
 * Refresh the access token using a valid refresh token.
 * Implements refresh token rotation.
 */
const refresh = async (refreshTokenRaw, ip, userAgent) => {
  if (!refreshTokenRaw) {
    throw ApiError.unauthorized(MESSAGES.NO_REFRESH_TOKEN);
  }

  // We need to find which user this token belongs to.
  // Since tokens are hashed, we check all active tokens.
  // Optimization: In production, you'd want to store userId in the cookie or a signed JWT.
  const RefreshToken = require('../models/RefreshToken');
  const allTokens = await RefreshToken.find({});

  let matchedTokenDoc = null;
  const bcrypt = require('bcryptjs');

  for (const tokenDoc of allTokens) {
    const isMatch = await bcrypt.compare(refreshTokenRaw, tokenDoc.tokenHash);
    if (isMatch) {
      matchedTokenDoc = tokenDoc;
      break;
    }
  }

  if (!matchedTokenDoc) {
    throw ApiError.unauthorized(MESSAGES.INVALID_TOKEN);
  }

  // Check expiry
  if (matchedTokenDoc.expiresAt < new Date()) {
    await RefreshToken.deleteToken(matchedTokenDoc._id);
    throw ApiError.unauthorized(MESSAGES.REFRESH_TOKEN_EXPIRED);
  }

  const userId = matchedTokenDoc.userId;

  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    await RefreshToken.deleteToken(matchedTokenDoc._id);
    throw ApiError.unauthorized(MESSAGES.USER_NOT_FOUND);
  }

  // Rotate: delete old token, generate + save new one
  const { rawToken: newRefreshToken } = await tokenService.rotateRefreshToken(
    userId,
    matchedTokenDoc._id,
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
 * Logout — delete refresh token and clear cookie.
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
