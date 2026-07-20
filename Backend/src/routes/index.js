/**
 * Central route index.
 * Mounts all route modules under their API prefixes.
 */
const { Router } = require('express');
const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');

const router = Router();

// Mount auth routes
router.use('/auth', authRoutes);

// Mount patient (user) routes
router.use('/patients', patientRoutes);

// Future route modules:
// router.use('/records', recordRoutes);
// router.use('/hospitals', hospitalRoutes);

module.exports = router;

