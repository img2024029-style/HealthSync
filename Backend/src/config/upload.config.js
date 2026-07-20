/**
 * Multer upload configuration.
 * Handles file uploads for profile pictures with validation.
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

// ─── Upload Directory ──────────────────────────────────
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const PROFILE_DIR = path.join(UPLOAD_DIR, 'profiles');

// Ensure upload directory exists
if (!fs.existsSync(PROFILE_DIR)) {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
}

// ─── Allowed MIME Types ────────────────────────────────
const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// ─── Storage Configuration ─────────────────────────────
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PROFILE_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${req.user.id}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  },
});

// ─── File Filter ───────────────────────────────────────
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ApiError.badRequest(
        `Invalid file type. Allowed types: ${ALLOWED_MIMES.join(', ')}`
      ),
      false
    );
  }
};

// ─── Multer Instance ───────────────────────────────────
const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = {
  profileUpload,
  UPLOAD_DIR,
  PROFILE_DIR,
};
