const ApiError = require('../utils/ApiError');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log error in development or test
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    console.error('─── ERROR ───────────────────────────────────────');
    console.error(err);
    console.error('─────────────────────────────────────────────────');
  }

  // ─── Mongoose: Bad ObjectId ──────────────────────
  if (err.name === 'CastError') {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // ─── Mongoose: Duplicate Key ─────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    error = ApiError.conflict(`Duplicate value for: ${field}. Please use another value.`);
  }

  // ─── Mongoose: Validation Error ──────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    error = ApiError.badRequest('Validation failed', messages);
  }

  // ─── JWT: Invalid Token ──────────────────────────
  if (err.name === 'JsonWebTokenError') {
    error = ApiError.unauthorized('Invalid token. Please log in again.');
  }

  // ─── JWT: Expired Token ──────────────────────────
  if (err.name === 'TokenExpiredError') {
    error = ApiError.unauthorized('Token has expired. Please log in again.');
  }

  // ─── Default Response ────────────────────────────
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

module.exports = errorHandler;
