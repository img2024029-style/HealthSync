const jwt = require("jsonwebtoken");

/**
 * Sign a JWT for an authenticated account.
 * Payload carries just the id + role so any protected route can
 * look the account up in the right collection (User / Hospital / Admin).
 */
const generateToken = ({ id, role }) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

module.exports = generateToken;
