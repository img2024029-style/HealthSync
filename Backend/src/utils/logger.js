/**
 * Morgan HTTP request logger.
 * Only active in development mode.
 */
const morgan = require('morgan');

const setupLogger = (app) => {
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
};

module.exports = setupLogger;
