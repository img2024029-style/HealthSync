const crypto = require('crypto');

/**
 * Request ID middleware.
 * Assigns a unique UUID to each request to trace logs easily.
 */
const requestId = (req, res, next) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
};

module.exports = requestId;
