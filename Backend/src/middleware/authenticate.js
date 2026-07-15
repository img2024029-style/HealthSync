/**
 * JWT authentication middleware.
 * Extracts the access token from the Authorization header,
 * verifies it, and attaches the user payload to req.user.
 */
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const MESSAGES = require('../constants/messages');

const authenticate = (req, res, next) => {
  // Extract token from "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized(MESSAGES.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw ApiError.unauthorized(MESSAGES.UNAUTHORIZED);
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Access token has expired. Please refresh.');
    }
    throw ApiError.unauthorized(MESSAGES.INVALID_TOKEN);
  }
};

module.exports = authenticate;
