/**
 * Password validation chain.
 * Reusable across register, reset-password, and change-password.
 */
const { body } = require('express-validator');

// Common weak/blacklisted passwords list to reject
const BLACKLIST = [
  'password',
  'password123',
  '12345678',
  '123456789',
  'qwertyuiop',
  'admin123',
  'healthsync',
  'healthsync123',
  'welcome123',
];

/**
 * Returns a validation chain for a specific password field.
 * Includes character checks and weak password blacklist checking.
 */
const getPasswordSchema = (fieldName) => {
  const displayLabel = fieldName === 'newPassword' ? 'New password' : 'Password';
  return body(fieldName)
    .trim()
    .notEmpty()
    .withMessage(`${displayLabel} is required.`)
    .isLength({ min: 8, max: 128 })
    .withMessage(`${displayLabel} must be between 8 and 128 characters.`)
    .matches(/[a-z]/)
    .withMessage(`${displayLabel} must contain at least one lowercase letter.`)
    .matches(/[A-Z]/)
    .withMessage(`${displayLabel} must contain at least one uppercase letter.`)
    .matches(/\d/)
    .withMessage(`${displayLabel} must contain at least one number.`)
    .matches(/[@$!%*?&#+\-_]/)
    .withMessage(`${displayLabel} must contain at least one special character (@$!%*?&#+\\-_).`)
    .custom((value) => {
      if (BLACKLIST.includes(value.toLowerCase())) {
        throw new Error('This password is too common and insecure. Please choose a stronger password.');
      }
      return true;
    });
};

const passwordValidation = getPasswordSchema('password');

module.exports = { passwordValidation, getPasswordSchema };
