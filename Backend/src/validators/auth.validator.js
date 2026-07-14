/**
 * Auth route validators.
 * Validation chains for each auth endpoint using express-validator.
 */
const { body } = require('express-validator');
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
 * POST /api/auth/register/hospital
 */
const registerHospitalValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Hospital name is required.')
    .isLength({ min: 3, max: 200 })
    .withMessage('Hospital name must be between 3 and 200 characters.'),

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

  body('registrationNumber')
    .trim()
    .notEmpty()
    .withMessage('Hospital registration number is required.'),

  body('hospitalType')
    .trim()
    .notEmpty()
    .withMessage('Hospital type is required.')
    .isIn(['government', 'private', 'trust', 'clinic', 'multi-speciality'])
    .withMessage('Hospital type must be one of: government, private, trust, clinic, multi-speciality.'),

  body('street').trim().notEmpty().withMessage('Street address is required.'),
  body('city').trim().notEmpty().withMessage('City is required.'),
  body('state').trim().notEmpty().withMessage('State is required.'),

  body('pincode')
    .trim()
    .notEmpty()
    .withMessage('Pincode is required.')
    .matches(/^\d{6}$/)
    .withMessage('Please provide a valid 6-digit pincode.'),

  passwordValidation,
];

/**
 * POST /api/auth/login
 * `role` distinguishes which account collection to authenticate against
 * (defaults to 'patient' in the service layer if omitted).
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

  body('role')
    .optional()
    .trim()
    .isIn(['user', 'hospital'])
    .withMessage("Role must be 'user' or 'hospital'."),
];

module.exports = {
  registerValidator,
  registerHospitalValidator,
  loginValidator,
};
