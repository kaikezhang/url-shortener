import { Pool, PoolConfig } from 'pg';
import { config } from '../utils/config';
import { logger } from '../utils/logger';

/**
 * Converts an error to a loggable object
 */
function errorToObject(error: unknown): object {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
  return { error: String(error) };
}

/**
 * PostgreSQL connection pool configuration
 */
const poolConfig: PoolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  min: config.database.pool.min,
  max: config.database.pool.max,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

/**
 * PostgreSQL connection pool instance
 * Manages a pool of database connections for efficient query execution
 */
export const pool = new Pool(poolConfig);

/**
 * Event handlers for pool monitoring
 * Only enable in non-test environments to avoid Jest logging issues
 */
if (config.nodeEnv !== 'test') {
  pool.on('connect', () => {
    logger.info('New client connected to database pool');
  });

  pool.on('error', (err) => {
    logger.error('Unexpected error on idle database client', errorToObject(err));
  });

  pool.on('remove', () => {
    logger.info('Client removed from database pool');
  });
}

/**
 * Gracefully closes all connections in the pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}

/**
 * Tests the database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed', errorToObject(error));
    return false;
  }
}
