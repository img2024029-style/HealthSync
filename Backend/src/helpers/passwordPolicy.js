

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_])[A-Za-z\d@$!%*?&#+\-_]{8,}$/;

/**
 * Check if a password meets strength requirements.
 * Requirements:
 *   - Minimum 8 characters
 *   - At least one uppercase letter
 *   - At least one lowercase letter
 *   - At least one number
 *   - At least one special character
 *
 * @param {string} password
 * @returns {{ isValid: boolean, errors: string[] }}
 */
const validatePassword = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (!/[@$!%*?&#+\-_]/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&#+\\-_).');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = { validatePassword, PASSWORD_REGEX };