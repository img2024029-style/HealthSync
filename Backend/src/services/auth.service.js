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
const Hospital = require('../models/Hospital');
const tokenService = require('./token.service');
const auditService = require('./audit.service');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const MESSAGES = require('../constants/messages');
const ROLES = require('../constants/roles');

/**
 * Register a new user.
 *
 * NOTE: Email verification is temporarily bypassed — accounts are created
 * with isVerified: true directly, and no verification email is sent. This
 * is a stopgap until SMTP credentials are configured (see .env.example).
 * To re-enable: set isVerified back to its schema default (remove the
 * override below) and uncomment the verification token + email block.
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

  // Create user (auto-verified — see NOTE above)
  const user = await User.create({
    fullName: { firstName, lastName },
    email,
    mobileNumber,
    password,
    isVerified: true,
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
 * Register a new hospital account.
 * Mirrors `register()` above but against the Hospital collection, which has
 * its own required fields (registrationNumber, hospitalType, address, ...).
 * Email verification is bypassed here too, for the same reason.
 */
const registerHospital = async (hospitalData, ip, userAgent) => {
  const {
    name,
    email,
    mobileNumber,
    password,
    registrationNumber,
    hospitalType,
    street,
    city,
    state,
    pincode,
    country,
  } = hospitalData;

  const existingEmail = await Hospital.findOne({ email });
  if (existingEmail) {
    throw ApiError.conflict(MESSAGES.HOSPITAL_ALREADY_EXISTS);
  }

  const existingMobile = await Hospital.findOne({ mobileNumber });
  if (existingMobile) {
    throw ApiError.conflict(MESSAGES.HOSPITAL_MOBILE_ALREADY_EXISTS);
  }

  const existingRegistrationNumber = await Hospital.findOne({ registrationNumber });
  if (existingRegistrationNumber) {
    throw ApiError.conflict(MESSAGES.REGISTRATION_NUMBER_ALREADY_EXISTS);
  }

  const hospital = await Hospital.create({
    name,
    email,
    mobileNumber,
    password,
    registrationNumber,
    hospitalType,
    address: { street, city, state, pincode, country },
    isVerified: true,
  });

  auditService.logAuthEvent({
    userId: hospital._id,
    action: 'REGISTER',
    ip,
    userAgent,
    success: true,
    metadata: { role: ROLES.HOSPITAL },
  });

  logger.info('Hospital registered', { hospitalId: hospital._id, email });

  return {
    user: hospital.toJSON(),
    message: MESSAGES.HOSPITAL_REGISTER_SUCCESS,
  };
};

/**
 * Login a patient (User collection).
 * Includes account lockout after repeated failed attempts.
 */
const loginPatient = async (email, password, ip, userAgent) => {
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

  // Note: email-verification gate removed. Verification is bypassed at
  // registration (isVerified: true is set directly, see register()) and
  // there is no verify-email endpoint anymore for an account to ever
  // flip isVerified from false to true — so this check could only ever
  // permanently lock out accounts created before that bypass, with no
  // way to recover. Since verification isn't actually enforced anywhere
  // else in the app, gating login on it served no purpose.

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
 * Login a hospital (Hospital collection).
 * Simpler than loginPatient — the Hospital model has no lockout or email
 * verification fields, so those checks don't apply here.
 */
const loginHospital = async (email, password, ip, userAgent) => {
  const hospital = await Hospital.findOne({ email }).select('+password');

  if (!hospital) {
    throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
  }

  const isMatch = await hospital.comparePassword(password);

  if (!isMatch) {
    auditService.logAuthEvent({
      userId: hospital._id,
      action: 'LOGIN_FAILED',
      ip,
      userAgent,
      success: false,
      metadata: { reason: 'invalid_password', role: ROLES.HOSPITAL },
    });
    throw ApiError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
  }

  if (hospital.isActive === false) {
    throw ApiError.forbidden('This hospital account has been deactivated.');
  }

  const accessToken = tokenService.generateAccessToken(hospital._id, ROLES.HOSPITAL);
  const refreshTokenRaw = tokenService.generateRefreshToken();

  await tokenService.saveRefreshToken(hospital._id, refreshTokenRaw, ip, userAgent);

  auditService.logAuthEvent({
    userId: hospital._id,
    action: 'LOGIN',
    ip,
    userAgent,
    success: true,
    metadata: { role: ROLES.HOSPITAL },
  });

  logger.info('Hospital logged in', { hospitalId: hospital._id, ip });

  return {
    user: hospital.toJSON(),
    accessToken,
    refreshToken: refreshTokenRaw,
  };
};

/**
 * Login dispatcher — routes to the correct collection based on role.
 * Defaults to 'patient' when role is omitted (keeps the existing patient
 * flow working unchanged for any caller that doesn't pass a role).
 */
const login = async (email, password, role, ip, userAgent) => {
  if (role === ROLES.HOSPITAL) {
    return loginHospital(email, password, ip, userAgent);
  }
  return loginPatient(email, password, ip, userAgent);
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

  // The RefreshToken collection is shared across account types (User and
  // Hospital), so we don't know which collection this id belongs to —
  // try User first, fall back to Hospital.
  let account = await User.findById(userId);
  let role = account ? ROLES.USER : null;

  if (!account) {
    account = await Hospital.findById(userId);
    role = account ? ROLES.HOSPITAL : null;
  }

  if (!account) {
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
  const accessToken = tokenService.generateAccessToken(userId, role);

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
 * Get current user profile.
 * `role` comes from the verified JWT (req.user.role) and determines which
 * collection to look the account up in.
 */
const getCurrentUser = async (userId, role) => {
  const Model = role === ROLES.HOSPITAL ? Hospital : User;
  const account = await Model.findById(userId);

  if (!account) {
    throw ApiError.notFound(role === ROLES.HOSPITAL ? MESSAGES.HOSPITAL_NOT_FOUND : MESSAGES.USER_NOT_FOUND);
  }

  return { user: account.toJSON() };
};

module.exports = {
  register,
  registerHospital,
  login,
  refresh,
  logout,
  getCurrentUser,
};
