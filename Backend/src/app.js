/**
 * Express application setup.
 * Configures middleware in the correct order as specified.
 *
 * Middleware Order:
 *   1. cors
 *   2. helmet (via security.js)
 *   3. morgan (dev only)
 *   4. compression
 *   5. express.json()
 *   6. cookieParser()
 *   7. mongoSanitize() (via security.js)
 *   8. hpp() (via security.js)
 *   9. xss() (via security.js)
 *  10. generalLimiter
 *  11. routes
 *  12. notFound
 *  13. errorHandler
 *
 * Note: CORS is registered FIRST, ahead of helmet/security. If any
 * later middleware throws (e.g. a bug in the sanitizer), Express's
 * error handler still responds through a request that already has
 * Access-Control-Allow-Origin attached — otherwise the browser reports
 * a misleading "No Access-Control-Allow-Origin header" CORS error that
 * has nothing to do with CORS config itself, it's just masking a crash
 * upstream of where CORS used to be mounted.
 */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');

const requestId = require('./middleware/requestId');
const applySecurity = require('./middleware/security');
const { generalLimiter } = require('./middleware/rateLimiter');
const { setupHttpLogger } = require('./utils/logger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// ─── 0. Request ID (Must be first for tracing) ───────────────  ??
app.use(requestId);

// ─── 1. CORS ─────────────────────────────────────────────────
const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
// Note: app.use(cors(...)) already short-circuits OPTIONS preflight
// requests for every route on its own — no separate app.options()
// handler is needed (and a bare '*' path errors under Express 5's
// path-to-regexp v8, which dropped that wildcard syntax).

// ─── 2. Security Headers (helmet, mongoSanitize, hpp, xss) ──
applySecurity(app);

// ─── 3. Request Logging (development only) ───────────────────
setupHttpLogger(app);

// ─── 4. Compression ─────────────────────────────────────────
app.use(compression());

// ─── 5. Body Parsers ────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));  //what is url encoded used for

// ─── 6. Cookie Parser ──────────────────────────────────────
app.use(cookieParser());

// ─── 6.5. Static Files (uploaded profile pictures, etc.) ───
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads', express.static(path.join(process.cwd(), uploadDir)));

// ─── 7. General Rate Limiter ────────────────────────────────  ??
app.use(generalLimiter);

// ─── 8. Health Check ────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HealthSync API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── 9. API Routes ──────────────────────────────────────────
app.use('/api', routes);

// ─── 10. 404 Handler ────────────────────────────────────────
app.use(notFound);

// ─── 11. Global Error Handler ───────────────────────────────
app.use(errorHandler);

module.exports = app;
