import { Pool } from 'pg';
import { Migration } from '../migrate';

/**
 * Migration: Create urls table
 * Creates the main table for storing URL mappings
 */
const migration: Migration = {
  id: '001',
  name: '001_create_urls_table',

  async up(pool: Pool): Promise<void> {
    await pool.query(`
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
    `);
  },

  async down(pool: Pool): Promise<void> {
    await pool.query(`
      DROP TABLE IF EXISTS urls;
    `);
  },
};

export default migration;
