import Redis from 'ioredis';
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
 * Redis client instance for caching
 * Uses ioredis for better TypeScript support and connection handling
 */
let redisClient: Redis | null = null;

/**
 * Initializes Redis client if caching is enabled
 */
export function initRedis(): Redis | null {
  if (!config.features.caching) {
    logger.info('Redis caching is disabled');
    return null;
  }

  try {
    // Use REDIS_URL if provided (Railway, Heroku, etc.), otherwise use host/port
    if (config.redis.url) {
      redisClient = new Redis(config.redis.url, {
        keyPrefix: config.redis.keyPrefix,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });
    } else {
      redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        keyPrefix: config.redis.keyPrefix,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });
    }

    redisClient.on('connect', () => {
      logger.info('Redis client connected', {
        host: config.redis.host,
        port: config.redis.port,
      });
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', errorToObject(err));
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', errorToObject(error));
    return null;
  }
}

/**
 * Gets the Redis client instance
 */
export function getRedis(): Redis | null {
  return redisClient;
}

/**
 * Closes the Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}

/**
 * Cache helper functions
 */

/**
 * Gets a value from cache
 * @param key - Cache key
 * @returns Cached value or null if not found
 */
export async function getCached<T>(key: string): Promise<T | null> {
  if (!redisClient || !config.features.caching) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    if (!value) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    logger.error('Cache get error', { key, ...errorToObject(error) });
    return null;
  }
}

/**
 * Sets a value in cache
 * @param key - Cache key
 * @param value - Value to cache
 * @param ttl - Time to live in seconds (optional, uses config default)
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttl?: number
): Promise<void> {
  if (!redisClient || !config.features.caching) {
    return;
  }

  try {
    const serialized = JSON.stringify(value);
    const cacheTtl = ttl || config.redis.ttl;

    await redisClient.setex(key, cacheTtl, serialized);
  } catch (error) {
    logger.error('Cache set error', { key, ...errorToObject(error) });
  }
}

/**
 * Deletes a value from cache
 * @param key - Cache key
 */
export async function deleteCached(key: string): Promise<void> {
  if (!redisClient || !config.features.caching) {
    return;
  }

  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error('Cache delete error', { key, ...errorToObject(error) });
  }
}

/**
 * Deletes multiple keys matching a pattern
 * @param pattern - Key pattern (e.g., "url:*")
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
  if (!redisClient || !config.features.caching) {
    return;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    logger.error('Cache pattern delete error', { pattern, ...errorToObject(error) });
  }
}

/**
 * Tests the Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  if (!redisClient || !config.features.caching) {
    return false;
  }

  try {
    const result = await redisClient.ping();
    logger.info('Redis connection test successful', { result });
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis connection test failed', errorToObject(error));
    return false;
  }
}
