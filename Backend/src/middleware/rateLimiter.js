/**
 * Rate limiting middleware.
 * Different limits for different route groups.
 * Limiters are bypassed when NODE_ENV is 'test' or 'development' to prevent local development blocks.
 */
const rateLimit = require('express-rate-limit');
const { rateLimits } = require('../config/jwt.config');
const MESSAGES = require('../constants/messages');

// Helper to bypass rate limiting in development and test environments
const skipInDevAndTest = (limiter) => {
  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      return next();
    }
    return limiter(req, res, next);
  };
};

/**
 * General API rate limiter — 100 requests per 15 minutes.
 */
const generalLimiter = skipInDevAndTest(
  rateLimit({
    windowMs: rateLimits.general.windowMs,
    max: rateLimits.general.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: MESSAGES.TOO_MANY_REQUESTS,
    },
  })
);

/**
 * Auth route rate limiter — 5 requests per 15 minutes.
 * Applies to login and similar sensitive endpoints.
 */
const authLimiter = skipInDevAndTest(
  rateLimit({
    windowMs: rateLimits.auth.windowMs,
    max: rateLimits.auth.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: MESSAGES.TOO_MANY_REQUESTS,
    },
  })
);

/**
 * Registration rate limiter — 3 requests per hour.
 */
const registerLimiter = skipInDevAndTest(
  rateLimit({
    windowMs: rateLimits.register.windowMs,
    max: rateLimits.register.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: MESSAGES.TOO_MANY_REQUESTS,
    },
  })
);

/**
 * Forgot password rate limiter — 3 requests per hour.
 */
const forgotPasswordLimiter = skipInDevAndTest(
  rateLimit({
    windowMs: rateLimits.forgotPassword.windowMs,
    max: rateLimits.forgotPassword.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: MESSAGES.TOO_MANY_REQUESTS,
    },
  })
);

/**
 * Email verification rate limiter — 5 requests per hour.
 */
const emailVerificationLimiter = skipInDevAndTest(
  rateLimit({
    windowMs: rateLimits.emailVerification.windowMs,
    max: rateLimits.emailVerification.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: MESSAGES.TOO_MANY_REQUESTS,
    },
  })
);

module.exports = {
  generalLimiter,
  authLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  emailVerificationLimiter,
};
