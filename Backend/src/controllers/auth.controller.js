/**
 * Auth controller.
 * Thin layer — delegates all logic to auth.service.js.
 * Handles HTTP concerns: request parsing, cookies, response status codes.
 */
const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const MESSAGES = require('../constants/messages');
const { REFRESH_TOKEN_COOKIE_NAME, getCookieOptions, getClearCookieOptions } = require('../config/cookie.config');

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, mobileNumber, password } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await authService.register(
    { firstName, lastName, email, mobileNumber, password },
    ip,
    userAgent
  );

  const response = ApiResponse.created(result.user, result.message);
  res.status(response.statusCode).json(response);
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await authService.login(email, password, ip, userAgent);

  // Set refresh token in HttpOnly cookie
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, getCookieOptions());

  const response = ApiResponse.ok(
    {
      user: result.user,
      accessToken: result.accessToken,
    },
    MESSAGES.LOGIN_SUCCESS
  );
  res.status(response.statusCode).json(response);
});

/**
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  await authService.logout(req.user.id, ip, userAgent);

  // Clear the refresh token cookie
  res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getClearCookieOptions());

  const response = ApiResponse.ok(null, MESSAGES.LOGOUT_SUCCESS);
  res.status(response.statusCode).json(response);
});

/**
 * POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE_NAME];
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await authService.refresh(refreshToken, ip, userAgent);

  // Set new refresh token cookie (rotation)
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, getCookieOptions());

  const response = ApiResponse.ok(
    { accessToken: result.accessToken },
    MESSAGES.REFRESH_SUCCESS
  );
  res.status(response.statusCode).json(response);
});

/**
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getCurrentUser(req.user.id);

  const response = ApiResponse.ok(result.user);
  res.status(response.statusCode).json(response);
});

/**
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.params.token);

  const response = ApiResponse.ok(null, result.message);
  res.status(response.statusCode).json(response);
});

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await authService.forgotPassword(email, ip, userAgent);

  const response = ApiResponse.ok(null, result.message);
  res.status(response.statusCode).json(response);
});

/**
 * POST /api/auth/reset-password/:token
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await authService.resetPassword(req.params.token, password, ip, userAgent);

  const response = ApiResponse.ok(null, result.message);
  res.status(response.statusCode).json(response);
});

module.exports = {
  register,
  login,
  logout,
  refresh,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
