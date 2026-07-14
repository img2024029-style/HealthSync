/**
 * Express application setup.
 * Configures middleware in the correct order as specified.
 *
 * Middleware Order:
 *   1. helmet (via security.js)
 *   2. cors
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
 */
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const applySecurity = require('./middleware/security');
const { generalLimiter } = require('./middleware/rateLimiter');
const setupLogger = require('./utils/logger');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// ─── 1. Security Headers (helmet, mongoSanitize, hpp, xss) ──
applySecurity(app);

// ─── 2. CORS ─────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── 3. Request Logging (development only) ───────────────────
setupLogger(app);

// ─── 4. Compression ─────────────────────────────────────────
app.use(compression());

// ─── 5. Body Parsers ────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── 6. Cookie Parser ──────────────────────────────────────
app.use(cookieParser());

// ─── 7. General Rate Limiter ────────────────────────────────
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
