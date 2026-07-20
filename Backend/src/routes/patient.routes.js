/**
 * Patient routes.
 * All routes prefixed with /api/patients (mounted in routes/index.js).
 * Every route requires authentication + user role authorization.
 */
const { Router } = require('express');
const patientController = require('../controllers/patient.controller');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { updateProfileValidator } = require('../validators/patient.validator');
const { profileUpload } = require('../config/upload.config');

const router = Router();

// All patient routes require authentication and user role
router.use(authenticate, authorize('user'));

// ─── Profile ───────────────────────────────────────────

// Get full patient profile
router.get('/profile', patientController.getProfile);

// Update patient profile
router.patch(
  '/profile',
  updateProfileValidator,
  validate,
  patientController.updateProfile
);

// Upload profile picture
router.post(
  '/profile/picture',
  profileUpload.single('profilePicture'),
  patientController.uploadProfilePicture
);

// Delete profile picture
router.delete('/profile/picture', patientController.deleteProfilePicture);

// ─── Dashboard ─────────────────────────────────────────

// Get dashboard summary (profile completeness, counts)
router.get('/dashboard', patientController.getDashboardSummary);

module.exports = router;
