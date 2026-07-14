/**
 * Password validation chain.
 * Reusable across register, reset-password, etc.
 */
const { body } = require('express-validator');
const MESSAGES = require('../constants/messages');

const passwordValidation = body('password')
  .trim()
  .notEmpty()
  .withMessage('Password is required.')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters.')
  .matches(/[a-z]/)
  .withMessage('Password must contain at least one lowercase letter.')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter.')
  .matches(/\d/)
  .withMessage('Password must contain at least one number.')
  .matches(/[@$!%*?&#+\-_]/)
  .withMessage('Password must contain at least one special character (@$!%*?&#+\\-_).');

module.exports = { passwordValidation };
