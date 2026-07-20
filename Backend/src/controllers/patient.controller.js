/**
 * Patient controller.
 * Handles HTTP concerns for patient profile management.
 * Delegates all business logic to patient.service.
 */
const patientService = require('../services/patient.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');

/**
 * GET /api/patients/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const result = await patientService.getProfile(req.user.id);

  const response = ApiResponse.ok(result.user);
  res.status(response.statusCode).json(response);
});

/**
 * PATCH /api/patients/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await patientService.updateProfile(req.user.id, req.body, ip, userAgent);

  const response = ApiResponse.ok(result.user, result.message);
  res.status(response.statusCode).json(response);
});

/**
 * POST /api/patients/profile/picture
 */
const uploadProfilePicture = asyncHandler(async (req, res) => {
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await patientService.uploadProfilePicture(req.user.id, req.file, ip, userAgent);

  const response = ApiResponse.ok(result.user, result.message);
  res.status(response.statusCode).json(response);
});

/**
 * DELETE /api/patients/profile/picture
 */
const deleteProfilePicture = asyncHandler(async (req, res) => {
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  const result = await patientService.deleteProfilePicture(req.user.id, ip, userAgent);

  const response = ApiResponse.ok(result.user, result.message);
  res.status(response.statusCode).json(response);
});

/**
 * GET /api/patients/dashboard
 */
const getDashboardSummary = asyncHandler(async (req, res) => {
  const result = await patientService.getDashboardSummary(req.user.id);

  const response = ApiResponse.ok(result);
  res.status(response.statusCode).json(response);
});

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
  getDashboardSummary,
};
