/**
 * Centralized message constants.
 * Avoids magic strings across controllers and services.
 */
const MESSAGES = Object.freeze({
  // ─── Auth ────────────────────────────────────────
  // NOTE: email verification is temporarily bypassed (see auth.service.js) —
  // accounts are auto-verified on registration until SMTP is configured.
  REGISTER_SUCCESS: 'Registration successful.',
  HOSPITAL_REGISTER_SUCCESS: 'Hospital registered successfully.',
  LOGIN_SUCCESS: 'Login successful.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  REFRESH_SUCCESS: 'Token refreshed successfully.',

  // ─── Errors ──────────────────────────────────────
  INVALID_CREDENTIALS: 'Invalid email or password.',
  USER_NOT_FOUND: 'User not found.',
  USER_ALREADY_EXISTS: 'A user with this email already exists.',
  MOBILE_ALREADY_EXISTS: 'A user with this mobile number already exists.',
  HOSPITAL_NOT_FOUND: 'Hospital not found.',
  HOSPITAL_ALREADY_EXISTS: 'A hospital with this email already exists.',
  HOSPITAL_MOBILE_ALREADY_EXISTS: 'A hospital with this mobile number already exists.',
  REGISTRATION_NUMBER_ALREADY_EXISTS: 'A hospital with this registration number already exists.',
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in.',
  ACCOUNT_LOCKED: 'Account temporarily locked due to too many failed login attempts. Please try again later.',
  INVALID_TOKEN: 'Invalid or expired token.',
  NO_REFRESH_TOKEN: 'No refresh token provided.',
  REFRESH_TOKEN_EXPIRED: 'Refresh token has expired. Please login again.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN: 'You do not have permission to perform this action.',

  // ─── Validation ──────────────────────────────────
  VALIDATION_ERROR: 'Validation failed.',
  PASSWORD_WEAK: 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.',
  INVALID_EMAIL: 'Please provide a valid email address.',
  INVALID_MOBILE: 'Please provide a valid 10-digit Indian mobile number.',

  // ─── General ─────────────────────────────────────
  SERVER_ERROR: 'Something went wrong. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
});

module.exports = MESSAGES;
