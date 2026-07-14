/**
 * Email service.
 * Sends transactional emails using Nodemailer.
 * In development, logs email content to console if SMTP is not configured.
 */
const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize the email transporter.
 * Called lazily on first send.
 */
const getTransporter = () => {
  if (transporter) return transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  // If SMTP credentials are available, create real transporter
  if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: parseInt(EMAIL_PORT, 10) || 587,
      secure: parseInt(EMAIL_PORT, 10) === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });
    return transporter;
  }

  return null;
};

/**
 * Send an email. Falls back to console logging in development.
 */
const sendEmail = async ({ to, subject, html }) => {
  const transport = getTransporter();

  if (!transport) {
    // Dev fallback — log to console
    console.log('──────────────────────────────────────────────────');
    console.log('  📧 EMAIL (dev mode — no SMTP configured)');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:    ${html}`);
    console.log('──────────────────────────────────────────────────');
    return;
  }

  const from = process.env.EMAIL_FROM || `HealthSync <${process.env.EMAIL_USER}>`;

  await transport.sendMail({ from, to, subject, html });
};

/**
 * Send email verification link.
 */
const sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

  await sendEmail({
    to: email,
    subject: 'HealthSync — Verify Your Email',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a73e8;">Welcome to HealthSync 🏥</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" 
             style="background: #1a73e8; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link in your browser:<br>
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px;">
          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

/**
 * Send password reset link.
 */
const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

  await sendEmail({
    to: email,
    subject: 'HealthSync — Reset Your Password',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a73e8;">Password Reset Request 🔒</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: #e53935; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link in your browser:<br>
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px;">
          This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
