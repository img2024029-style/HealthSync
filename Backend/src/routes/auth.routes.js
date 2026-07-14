/**
 * Auth routes.
 * All routes prefixed with /api/auth (mounted in routes/index.js).
 */
const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { authLimiter, registerLimiter } = require('../middleware/rateLimiter');
const {
  registerValidator,
  registerHospitalValidator,
  loginValidator,
} = require('../validators/auth.validator');

const router = Router();

// ─── Public Routes ─────────────────────────────────────

// Register a new user
router.post(
  '/register',
  registerLimiter,
  registerValidator,
  validate,
  authController.register
);

// Register a new hospital
router.post(
  '/register/hospital',
  registerLimiter,
  registerHospitalValidator,
  validate,
  authController.registerHospital
);

// Login
router.post(
  '/login',
  authLimiter,
  loginValidator,
  validate,
  authController.login
);

// Refresh access token
router.post(
  '/refresh',
  authController.refresh
);

// ─── Protected Routes ──────────────────────────────────

// Logout (requires authentication)
router.post(
  '/logout',
  authenticate,
  authController.logout
);

// Get current user profile
router.get(
  '/me',
  authenticate,
  authController.getMe
);

module.exports = router;
