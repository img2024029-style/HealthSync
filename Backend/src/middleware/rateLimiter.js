/**
 * Rate limiting middleware.
 * Different limits for different route groups.
 */
const rateLimit = require('express-rate-limit');
const { rateLimits } = require('../config/jwt.config');
const MESSAGES = require('../constants/messages');

/**
 * General API rate limiter — 100 requests per 15 minutes.
 */
const generalLimiter = rateLimit({
  windowMs: rateLimits.general.windowMs,
  max: rateLimits.general.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: MESSAGES.TOO_MANY_REQUESTS,
  },
});

/**
 * Auth route rate limiter — 5 requests per 15 minutes.
 * Applies to login and similar sensitive endpoints.
 */
const authLimiter = rateLimit({
  windowMs: rateLimits.auth.windowMs,
  max: rateLimits.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: MESSAGES.TOO_MANY_REQUESTS,
  },
});

/**
 * Registration rate limiter — 3 requests per hour.
 */
const registerLimiter = rateLimit({
  windowMs: rateLimits.register.windowMs,
  max: rateLimits.register.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: MESSAGES.TOO_MANY_REQUESTS,
  },
});

module.exports = { generalLimiter, authLimiter, registerLimiter };
