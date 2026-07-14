/**
 * Security middleware bundle.
 * Applies all HTTP security hardening in one call.
 */
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const xss = require('xss-clean');

const applySecurity = (app) => {
  // Set secure HTTP headers (clickjacking, MIME sniffing, etc.)
  app.use(helmet());

  // Sanitize user input — blocks NoSQL injection like { "$gt": "" }
  app.use(mongoSanitize());

  // Prevent HTTP parameter pollution (?id=1&id=2&id=3)
  app.use(hpp());

  // Sanitize user input — strips <script> tags and XSS payloads
  app.use(xss());
};

module.exports = applySecurity;
