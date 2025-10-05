/**
 * Database migration script
 * Creates the necessary tables and indexes if they don't exist
 */

import { pool } from './pool';
import { logger } from '../utils/logger';

/**
 * Database schema SQL
 */
const SCHEMA_SQL = `
-- Create urls table
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(20) NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  clicks INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at);
CREATE INDEX IF NOT EXISTS idx_urls_original_url ON urls(original_url);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_urls_updated_at ON urls;
CREATE TRIGGER update_urls_updated_at
    BEFORE UPDATE ON urls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
`;

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    logger.info('Running database migrations...');

    await pool.query(SCHEMA_SQL);

    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Database migration failed', { error });
    throw error;
  }
}

/**
 * Check if database is initialized
 */
export async function isDatabaseInitialized(): Promise<boolean> {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'urls'
      );
    `);

    return result.rows[0].exists;
  } catch (error) {
    logger.error('Failed to check database initialization', { error });
    return false;
  }
}

// If run directly, execute migrations
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration script failed', { error });
      process.exit(1);
    });
}
