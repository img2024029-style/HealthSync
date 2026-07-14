/**
 * Environment variable validation.
 * Fail fast on startup if any required variable is missing or malformed.
 *
 * Validates:
 *   - Presence of all required variables
 *   - JWT secret minimum length (64 chars)
 *   - PORT is a valid number
 *   - NODE_ENV is a recognized value
 *   - MONGO_URI format
 *   - CLIENT_URL format
 */

const requiredEnvVars = [
  'PORT',
  'MONGO_URI',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'NODE_ENV',
  'CLIENT_URL',
];

const VALID_NODE_ENVS = ['development', 'production', 'test'];

const validateEnv = () => {
  const errors = [];

  // ─── 1. Check required variables exist ────────────────
  requiredEnvVars.forEach((key) => {
    if (!process.env[key] || process.env[key].trim() === '') {
      errors.push(`Missing required variable: ${key}`);
    }
  });

  // ─── 2. Validate NODE_ENV ─────────────────────────────
  if (process.env.NODE_ENV && !VALID_NODE_ENVS.includes(process.env.NODE_ENV)) {
    errors.push(`Invalid NODE_ENV: "${process.env.NODE_ENV}". Must be one of: ${VALID_NODE_ENVS.join(', ')}`);
  }

  // ─── 3. Validate PORT ────────────────────────────────
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT, 10);
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.push(`Invalid PORT: "${process.env.PORT}". Must be a number between 1 and 65535.`);
    }
  }

  // ─── 4. Validate JWT secret lengths ───────────────────
  if (process.env.ACCESS_TOKEN_SECRET && process.env.ACCESS_TOKEN_SECRET.length < 64) {
    errors.push(`ACCESS_TOKEN_SECRET is too short (${process.env.ACCESS_TOKEN_SECRET.length} chars). Minimum: 64 characters.`);
  }
  if (process.env.REFRESH_TOKEN_SECRET && process.env.REFRESH_TOKEN_SECRET.length < 64) {
    errors.push(`REFRESH_TOKEN_SECRET is too short (${process.env.REFRESH_TOKEN_SECRET.length} chars). Minimum: 64 characters.`);
  }

  // ─── 5. Validate MONGO_URI format ────────────────────
  if (process.env.MONGO_URI && !process.env.MONGO_URI.startsWith('mongodb')) {
    errors.push(`Invalid MONGO_URI: must start with "mongodb://" or "mongodb+srv://".`);
  }

  // ─── 6. Validate CLIENT_URL format ───────────────────
  if (process.env.CLIENT_URL) {
    try {
      new URL(process.env.CLIENT_URL);
    } catch {
      errors.push(`Invalid CLIENT_URL: "${process.env.CLIENT_URL}". Must be a valid URL.`);
    }
  }

  // ─── Report errors ───────────────────────────────────
  if (errors.length > 0) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════╗');
    console.error('║  FATAL: Environment validation failed           ║');
    console.error('╠══════════════════════════════════════════════════╣');
    errors.forEach((err) => {
      console.error(`║  ✖  ${err}`);
    });
    console.error('║                                                  ║');
    console.error('║  Copy .env.example → .env and fill in values.    ║');
    console.error('╚══════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1);
  }
};

module.exports = validateEnv;
