import { createApp } from './app';
import { config, validateConfig } from './utils/config';
import { logger } from './utils/logger';
import { runMigrations, testConnection } from './database';
import { initRedis, closeRedis, testRedisConnection } from './database/redis';

/**
 * Starts the server
 */
async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();

    // Test database connection
    logger.info('Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Run database migrations (auto-create tables)
    logger.info('Running database migrations...');
    await runMigrations();

    // Initialize Redis (if caching enabled)
    if (config.features.caching) {
      logger.info('Initializing Redis...');
      initRedis();
      const redisConnected = await testRedisConnection();
      if (redisConnected) {
        logger.info('Redis connection successful');
      } else {
        logger.warn('Redis connection failed - continuing without cache');
      }
    }

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(config.port, () => {
      logger.info(`Server started successfully`, {
        port: config.port,
        env: config.nodeEnv,
        baseUrl: config.baseUrl,
        features: config.features,
      });

      logger.info(`API available at ${config.baseUrl}/api`);
      logger.info(`Ready to shorten URLs!`);
    });

    // Graceful shutdown
    const shutdown = async (): Promise<void> => {
      logger.info('Shutting down gracefully...');

      // Close Redis connection
      if (config.features.caching) {
        await closeRedis();
      }

      server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
startServer();
