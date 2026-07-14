/**
 * Environment variable validation.
 * Fail fast on startup if any required variable is missing.
 */

const requiredEnvVars = [
  'PORT',
  'MONGO_URI',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'NODE_ENV',
  'CLIENT_URL',
];

// Email vars are only required in production
const requiredInProduction = [
  'EMAIL_HOST',
  'EMAIL_PORT',
  'EMAIL_USER',
  'EMAIL_PASS',
];

const validateEnv = () => {
  const missing = [];

  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (process.env.NODE_ENV === 'production') {
    requiredInProduction.forEach((key) => {
      if (!process.env[key]) {
        missing.push(key);
      }
    });
  }

  if (missing.length > 0) {
    console.error('──────────────────────────────────────────────────');
    console.error('  FATAL: Missing required environment variables:');
    missing.forEach((key) => console.error(`    ✖  ${key}`));
    console.error('');
    console.error('  Copy .env.example to .env and fill in the values.');
    console.error('──────────────────────────────────────────────────');
    process.exit(1);
  }

  // Validate JWT secret length (minimum 64 chars)
  if (process.env.ACCESS_TOKEN_SECRET.length < 64) {
    console.error('FATAL: ACCESS_TOKEN_SECRET must be at least 64 characters.');
    process.exit(1);
  }
  if (process.env.REFRESH_TOKEN_SECRET.length < 64) {
    console.error('FATAL: REFRESH_TOKEN_SECRET must be at least 64 characters.');
    process.exit(1);
  }
};

module.exports = validateEnv;
