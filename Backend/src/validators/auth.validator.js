/**
 * Auth route validators.
 * Validation chains for each auth endpoint using express-validator.
 */
const { body, param } = require('express-validator');
const { passwordValidation } = require('./password.validator');

/**
 * POST /api/auth/register
 */
const registerValidator = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters.'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('mobileNumber')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required.')
    .matches(/^[6-9]\d{9}$/)
    .withMessage('Please provide a valid 10-digit Indian mobile number.'),

  passwordValidation,
];

/**
 * POST /api/auth/login
 */
const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required.'),
];

/**
 * POST /api/auth/forgot-password
 */
const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),
];

/**
 * POST /api/auth/reset-password/:token
 */
const resetPasswordValidator = [
  param('token')
    .notEmpty()
    .withMessage('Reset token is required.'),

  passwordValidation,
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
