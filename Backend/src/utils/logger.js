/**
 * Structured logger utility.
 *
 * Provides consistent, structured logging across the application.
 * In development: uses Morgan for HTTP request logging + colored console output.
 * In production: structured JSON output (ready for log aggregation).
 *
 * Usage:
 *   const logger = require('./logger');
 *   logger.info('User registered', { userId, email });
 *   logger.warn('Rate limit approaching', { ip, count });
 *   logger.error('Database write failed', { error: err.message });
 */
const morgan = require('morgan');

// ─── Log Level Colors (dev only) ─────────────────────
const COLORS = {
  info: '\x1b[36m',    // cyan
  warn: '\x1b[33m',    // yellow
  error: '\x1b[31m',   // red
  debug: '\x1b[90m',   // gray
  reset: '\x1b[0m',
};

const isDev = () => process.env.NODE_ENV === 'development';

/**
 * Format a log entry.
 * Dev:  [INFO] 2026-07-14T12:30:00Z — User registered { userId: "..." }
 * Prod: {"level":"info","message":"User registered","userId":"...","timestamp":"..."}
 */
const formatLog = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();

  if (isDev()) {
    const color = COLORS[level] || COLORS.reset;
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${color}[${level.toUpperCase()}]${COLORS.reset} ${timestamp} — ${message}${metaStr}`;
  }

  // Production: structured JSON (one line per log — ideal for ELK/CloudWatch/Datadog)
  return JSON.stringify({
    level,
    message,
    ...meta,
    timestamp,
  });
};

const logger = {
  info: (message, meta) => console.log(formatLog('info', message, meta)),
  warn: (message, meta) => console.warn(formatLog('warn', message, meta)),
  error: (message, meta) => console.error(formatLog('error', message, meta)),
  debug: (message, meta) => {
    if (isDev()) console.debug(formatLog('debug', message, meta));
  },
};

/**
 * Setup Morgan HTTP request logger middleware.
 * Only active in development.
 */
const setupHttpLogger = (app) => {
  if (isDev()) {
    app.use(morgan('dev'));
  }
};

// Export both the logger and the HTTP middleware setup
module.exports = logger;
module.exports.setupHttpLogger = setupHttpLogger;
