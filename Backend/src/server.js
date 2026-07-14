/**
 * Server entry point.
 * Loads environment, validates config, connects to DB, and starts the server.
 */
require('dotenv').config();

// Validate environment variables before anything else
const validateEnv = require('./config/env');
validateEnv();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log('──────────────────────────────────────────────────');
      console.log(`  🏥 HealthSync API Server`);
      console.log(`  ✔  Environment: ${process.env.NODE_ENV}`);
      console.log(`  ✔  Port:        ${PORT}`);
      console.log(`  ✔  URL:         http://localhost:${PORT}`);
      console.log('──────────────────────────────────────────────────');
    });

    // ─── Graceful Shutdown ─────────────────────────────
    const gracefulShutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        console.log('✔  HTTP server closed.');
        const mongoose = require('mongoose');
        mongoose.connection.close(false).then(() => {
          console.log('✔  MongoDB connection closed.');
          process.exit(0);
        });
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('✖  Forced shutdown after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('✖  Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

startServer();
