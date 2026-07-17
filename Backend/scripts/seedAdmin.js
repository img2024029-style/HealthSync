/**
 * Admin bootstrap script.
 *
 * Best practice: admin accounts are never created through a public API
 * endpoint (unlike patient/hospital signup). They're provisioned out-of-band,
 * by a trusted operator running this script directly against the database,
 * using credentials that live only in environment variables — never in
 * source control, never passed through the browser.
 *
 * Usage:
 *   1. Set ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD / ADMIN_SEED_FIRST_NAME /
 *      ADMIN_SEED_LAST_NAME / ADMIN_SEED_MOBILE in your local .env (or export
 *      them inline for a one-off run — see the example below). These are
 *      throwaway bootstrap values, not the account's permanent password.
 *   2. Run: npm run seed:admin
 *   3. Log in once at /admin/login, then immediately change the password
 *      (change-password is already wired up for all roles) and remove the
 *      ADMIN_SEED_* values from .env.
 *
 * The script is idempotent: re-running it with the same email updates that
 * admin's name/password/mobile instead of creating a duplicate, so it's also
 * safe to use for rotating a compromised admin password.
 *
 * One-off run without touching .env:
 *   ADMIN_SEED_EMAIL=you@example.com ADMIN_SEED_PASSWORD='Str0ng!Pass' \
 *   ADMIN_SEED_FIRST_NAME=Jane ADMIN_SEED_LAST_NAME=Doe \
 *   ADMIN_SEED_MOBILE=9876543210 npm run seed:admin
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../src/models/Admin');

const {
  MONGO_URI,
  ADMIN_SEED_EMAIL,
  ADMIN_SEED_PASSWORD,
  ADMIN_SEED_FIRST_NAME,
  ADMIN_SEED_LAST_NAME,
  ADMIN_SEED_MOBILE,
  ADMIN_SEED_ROLE, // 'admin' (default) or 'superadmin'
} = process.env;

async function seedAdmin() {
  const missing = [
    'ADMIN_SEED_EMAIL',
    'ADMIN_SEED_PASSWORD',
    'ADMIN_SEED_FIRST_NAME',
    'ADMIN_SEED_LAST_NAME',
    'ADMIN_SEED_MOBILE',
  ].filter((key) => !process.env[key]);

  if (missing.length) {
    console.error(
      `Missing required env vars: ${missing.join(', ')}\n` +
        'Set them in .env (temporarily) or inline before running this script — see the header comment in scripts/seedAdmin.js.'
    );
    process.exit(1);
  }

  if (ADMIN_SEED_PASSWORD.length < 8) {
    console.error('ADMIN_SEED_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const existing = await Admin.findOne({ email: ADMIN_SEED_EMAIL.toLowerCase() });

    if (existing) {
      existing.fullName = { firstName: ADMIN_SEED_FIRST_NAME, lastName: ADMIN_SEED_LAST_NAME };
      existing.mobileNumber = ADMIN_SEED_MOBILE;
      existing.password = ADMIN_SEED_PASSWORD; // re-hashed by the pre-save hook
      existing.role = ADMIN_SEED_ROLE === 'superadmin' ? 'superadmin' : existing.role;
      existing.isActive = true;
      existing.loginAttempts = 0;
      existing.lockUntil = null;
      await existing.save();
      console.log(`Updated existing admin account: ${existing.email} (${existing.role})`);
    } else {
      const admin = await Admin.create({
        fullName: { firstName: ADMIN_SEED_FIRST_NAME, lastName: ADMIN_SEED_LAST_NAME },
        email: ADMIN_SEED_EMAIL.toLowerCase(),
        mobileNumber: ADMIN_SEED_MOBILE,
        password: ADMIN_SEED_PASSWORD,
        role: ADMIN_SEED_ROLE === 'superadmin' ? 'superadmin' : 'admin',
      });
      console.log(`Created admin account: ${admin.email} (${admin.role})`);
    }

    console.log(
      '\nDone. Log in at /admin/login, then change this password and remove ADMIN_SEED_* from .env.'
    );
  } catch (error) {
    console.error('Failed to seed admin account:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

seedAdmin();
