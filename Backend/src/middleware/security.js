const helmet = require('helmet');
const hpp = require('hpp');
const { xss } = require('express-xss-sanitizer');
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
  app.use(helmet());

  app.use(sanitizeInPlace);

  app.use(hpp());
  app.use(xss());

  // Explicitly disable X-Powered-By header
  app.disable('x-powered-by');
};

module.exports = applySecurity;
