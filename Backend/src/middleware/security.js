/**
 * Security middleware bundle.
 * Applies all HTTP security hardening in one call.
 *
 * Note: Uses express-xss-sanitizer (actively maintained) instead of
 * the deprecated xss-clean package.
 *
 * Note: This file used to depend on express-mongo-sanitize@2.2.0.
 * That package's own middleware() unconditionally reassigns req.query,
 * req.body, req.params and req.headers — but in Express 5, req.query is
 * a getter-only property, so that reassignment throws "Cannot set
 * property query of #<IncomingMessage> which has only a getter" on
 * every single request. There's no newer major version that fixes
 * this (2.2.0 is the latest, and the project is unmaintained for
 * Express 5 compatibility).
 *
 * Rather than keep working around that package's internals (which
 * kept causing this exact crash to resurface), NoSQL-injection
 * sanitization is now a small, dependency-free function below. It
 * only ever mutates req.body/req.params in place — it never reads or
 * writes req.query or req.headers, and it has no dependency on any
 * third-party package that could reintroduce this bug.
 */
const helmet = require('helmet');
const hpp = require('hpp');
const { xss } = require('express-xss-sanitizer');

// Matches Mongo operator keys ($gt, $where, ...) and dotted keys, which
// Mongo/Mongoose can interpret as nested-field paths — both are the
// classic NoSQL-injection vector (e.g. { "$gt": "" }).
const PROHIBITED_KEY = /^\$|\./;

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    value.forEach(sanitizeValue);
    return;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (PROHIBITED_KEY.test(key)) {
        delete value[key];
      } else {
        sanitizeValue(value[key]);
      }
    }
  }
};

const sanitizeInPlace = (req, res, next) => {
  if (req.body) sanitizeValue(req.body);
  if (req.params) sanitizeValue(req.params);
  next();
};

const applySecurity = (app) => {
  // Set secure HTTP headers (clickjacking, MIME sniffing, etc.)
  app.use(helmet());

  // Sanitize user input — blocks NoSQL injection like { "$gt": "" }
  app.use(sanitizeInPlace);

  // Prevent HTTP parameter pollution (?id=1&id=2&id=3)
  app.use(hpp());

  // Sanitize user input — strips <script> tags and XSS payloads
  app.use(xss());
};

module.exports = applySecurity;
