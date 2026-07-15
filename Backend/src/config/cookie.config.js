/**
 * Centralized cookie configuration for refresh tokens.
 */

const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';

const getCookieOptions = () => ({
  httpOnly: true,                                    // Never expose to JavaScript
  secure: process.env.NODE_ENV === 'production',     // HTTPS only in production
  sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax', // Strict CSRF protection in prod
  maxAge: 7 * 24 * 60 * 60 * 1000,                  // 7 days in milliseconds
  path: '/',
});

/**
 * Returns options to clear (expire) the refresh token cookie.
 */
const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : 'Lax',
  path: '/',
});

module.exports = {
  REFRESH_TOKEN_COOKIE_NAME,
  getCookieOptions,
  getClearCookieOptions,
};
