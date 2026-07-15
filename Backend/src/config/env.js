const { z } = require('zod');

/**
 * Environment variable validation schema using Zod.
 * Fail fast on startup if any required variable is missing or malformed.
 */
const envSchema = z.object({
  PORT: z.preprocess(
    (val) => (val ? parseInt(val, 10) : 5000),
    z.number().int().min(1).max(65535)
  ),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  MONGO_URI: z.string().refine(
    (val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
    { message: 'MONGO_URI must be a valid MongoDB connection string starting with "mongodb://" or "mongodb+srv://"' }
  ),
  ACCESS_TOKEN_SECRET: z.string().min(64, {
    message: 'ACCESS_TOKEN_SECRET must be at least 64 characters long for security',
  }),
  REFRESH_TOKEN_SECRET: z.string().min(64, {
    message: 'REFRESH_TOKEN_SECRET must be at least 64 characters long for security',
  }),
  CLIENT_URL: z.string().url({ message: 'CLIENT_URL must be a valid URL' }),

  // SMTP Settings for verification/reset password
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.preprocess(
    (val) => (val ? parseInt(val, 10) : undefined),
    z.number().int().min(1).max(65535).optional()
  ),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const validateEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════╗');
    console.error('║  FATAL: Environment validation failed           ║');
    console.error('╠══════════════════════════════════════════════════╣');
    result.error.errors.forEach((err) => {
      console.error(`║  ✖  ${err.path.join('.')}: ${err.message}`);
    });
    console.error('║                                                  ║');
    console.error('║  Copy .env.example → .env and fill in values.    ║');
    console.error('╚══════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1);
  }
};

module.exports = validateEnv;
