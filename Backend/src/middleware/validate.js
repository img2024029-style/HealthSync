/**
 * Validation middleware using express-validator.
 * Runs the validation chain and returns errors if any.
 */
const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');
const MESSAGES = require('../constants/messages');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    throw new ApiError(422, MESSAGES.VALIDATION_ERROR, extractedErrors);
  }

  next();
};

module.exports = validate;
