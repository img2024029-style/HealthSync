/**
 * User roles.
 * Only 'user' is relevant for the auth module.
 * Additional roles (admin, hospital) will be added in later modules.
 */
const ROLES = Object.freeze({
  USER: 'user',
  ADMIN: 'admin',
  HOSPITAL: 'hospital',
});

module.exports = ROLES;
