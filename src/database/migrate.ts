import { Pool } from 'pg';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { pool } from './pool';
import { logger } from '../utils/logger';

/**
 * Migration interface
 */
export interface Migration {
  id: string;
  name: string;
  up: (pool: Pool) => Promise<void>;
  down: (pool: Pool) => Promise<void>;
}

/**
 * Creates the migrations tracking table if it doesn't exist
 */
async function createMigrationsTable(): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(query);
  logger.info('Migrations table ensured');
}

/**
 * Gets list of executed migrations
 */
async function getExecutedMigrations(): Promise<string[]> {
  const result = await pool.query(
    'SELECT name FROM migrations ORDER BY id ASC'
  );
  return result.rows.map((row) => row.name);
}

/**
 * Records a migration as executed
 */
async function recordMigration(name: string): Promise<void> {
  await pool.query(
    'INSERT INTO migrations (name) VALUES ($1)',
    [name]
  );
}

/**
 * Removes a migration record
 */
async function removeMigrationRecord(name: string): Promise<void> {
  await pool.query(
    'DELETE FROM migrations WHERE name = $1',
    [name]
  );
}

/**
 * Loads all migration files from the migrations directory
 */
async function loadMigrations(): Promise<Migration[]> {
  const migrationsPath = join(__dirname, 'migrations');
  const files = await readdir(migrationsPath);

  const migrationFiles = files
    .filter((file) => file.endsWith('.ts') || file.endsWith('.js'))
    .sort();

  const migrations: Migration[] = [];

  for (const file of migrationFiles) {
    const migrationModule = await import(join(migrationsPath, file));
    migrations.push(migrationModule.default);
  }

  return migrations;
}

/**
 * Runs pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    logger.info('Starting migrations...');

    await createMigrationsTable();

    const executedMigrations = await getExecutedMigrations();
    const allMigrations = await loadMigrations();

    const pendingMigrations = allMigrations.filter(
      (migration) => !executedMigrations.includes(migration.name)
    );

    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations');
      return;
    }

    logger.info(`Found ${pendingMigrations.length} pending migration(s)`);

    for (const migration of pendingMigrations) {
      logger.info(`Running migration: ${migration.name}`);

      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        await migration.up(pool);
        await recordMigration(migration.name);
        await client.query('COMMIT');

        logger.info(`Migration completed: ${migration.name}`);
      } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`Migration failed: ${migration.name}`, error);
        throw error;
      } finally {
        client.release();
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration process failed', error);
    throw error;
  }
}

/**
 * Rolls back the last migration
 */
export async function rollbackMigration(): Promise<void> {
  try {
    logger.info('Starting rollback...');

    const executedMigrations = await getExecutedMigrations();

    if (executedMigrations.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    const lastMigrationName = executedMigrations[executedMigrations.length - 1];
    const allMigrations = await loadMigrations();
    const migration = allMigrations.find((m) => m.name === lastMigrationName);

    if (!migration) {
      throw new Error(`Migration file not found: ${lastMigrationName}`);
    }

    logger.info(`Rolling back migration: ${migration.name}`);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await migration.down(pool);
      await removeMigrationRecord(migration.name);
      await client.query('COMMIT');

      logger.info(`Rollback completed: ${migration.name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Rollback failed: ${migration.name}`, error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Rollback process failed', error);
    throw error;
  }
}

/**
 * CLI entry point for running migrations
 */
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    try {
      if (command === 'up') {
        await runMigrations();
      } else if (command === 'down') {
        await rollbackMigration();
      } else {
        console.log('Usage: ts-node migrate.ts [up|down]');
        process.exit(1);
      }

      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error('Migration error:', error);
      await pool.end();
      process.exit(1);
    }
  })();
}
