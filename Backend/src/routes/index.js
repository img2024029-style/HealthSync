/**
 * Central route index.
 * Mounts all route modules under their API prefixes.
 */
const { Router } = require('express');
const authRoutes = require('./auth.routes');

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Future route modules:
// router.use('/users', userRoutes);
// router.use('/records', recordRoutes);
// router.use('/hospitals', hospitalRoutes);

module.exports = router;
