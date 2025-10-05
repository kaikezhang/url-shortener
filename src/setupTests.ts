/**
 * Jest setup file
 * Runs before all tests to initialize database
 */

import { runMigrations, closePool, pool } from './database';
import { logger } from './utils/logger';

/**
 * Setup function that runs before all tests
 */
beforeAll(async () => {
  try {
    // Run database migrations to create tables
    await runMigrations();
    logger.info('Test database initialized');
  } catch (error) {
    logger.error('Failed to initialize test database', { error });
    throw error;
  }
});

/**
 * Clean up database between tests
 */
afterEach(async () => {
  try {
    // Clean up all test data
    await pool.query('TRUNCATE TABLE urls RESTART IDENTITY CASCADE');
  } catch (error) {
    // Ignore errors if table doesn't exist
  }
});

/**
 * Cleanup function that runs after all tests
 */
afterAll(async () => {
  try {
    // Close database connections
    await closePool();
    logger.info('Test database connections closed');
  } catch (error) {
    logger.error('Failed to close database connections', { error });
  }
});
