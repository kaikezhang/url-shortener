import { customAlphabet } from 'nanoid';
import { UrlEntry, UrlAnalytics, UrlShortenerConfig } from '../types';
import { isValidUrl, isValidShortCode } from '../utils/validator';
import { logger } from '../utils/logger';
import { pool } from '../database';

/**
 * Core URL Shortener Service
 * Handles creation, storage, and retrieval of shortened URLs
 */
export class UrlShortenerService {
  private config: UrlShortenerConfig;

  // Custom alphabet for nanoid (URL-safe characters)
  private generateId: () => string;

  constructor(config: UrlShortenerConfig) {
    this.config = config;

    // Create custom ID generator with URL-safe characters
    const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    this.generateId = customAlphabet(alphabet, config.shortCodeLength);

    logger.info('UrlShortenerService initialized', { config });
  }

  /**
   * Creates a shortened URL
   * @param originalUrl - The URL to shorten
   * @param customCode - Optional custom short code (requires feature flag)
   * @returns The created URL entry
   * @throws Error if URL is invalid or custom code already exists
   */
  async createShortUrl(originalUrl: string, customCode?: string): Promise<UrlEntry> {
    // Validate URL
    if (!isValidUrl(originalUrl)) {
      logger.warn('Invalid URL provided', { originalUrl });
      throw new Error('Invalid URL provided');
    }

    let shortCode: string;

    // Handle custom short codes (if feature enabled)
    if (customCode) {
      if (!this.config.enableCustomCodes) {
        throw new Error('Custom short codes are not enabled');
      }

      if (!isValidShortCode(customCode)) {
        throw new Error('Invalid custom short code. Must be 3-20 alphanumeric characters, hyphens, or underscores');
      }

      // Check if custom code already exists
      const existing = await pool.query(
        'SELECT short_code FROM urls WHERE short_code = $1',
        [customCode]
      );

      if (existing.rows.length > 0) {
        throw new Error('Custom short code already exists');
      }

      shortCode = customCode;
      logger.info('Using custom short code', { shortCode, originalUrl });
    } else {
      // Generate unique short code
      shortCode = await this.generateUniqueShortCode();
      logger.debug('Generated short code', { shortCode, originalUrl });
    }

    // Insert into database
    const result = await pool.query(
      'INSERT INTO urls (short_code, original_url, clicks) VALUES ($1, $2, $3) RETURNING *',
      [shortCode, originalUrl, 0]
    );

    const row = result.rows[0];
    const urlEntry: UrlEntry = {
      shortCode: row.short_code,
      originalUrl: row.original_url,
      createdAt: row.created_at,
      accessCount: row.clicks,
    };

    logger.info('Short URL created', { shortCode, originalUrl });
    return urlEntry;
  }

  /**
   * Retrieves the original URL for a short code
   * @param shortCode - The short code to look up
   * @returns The URL entry if found, null otherwise
   */
  async getOriginalUrl(shortCode: string): Promise<UrlEntry | null> {
    // Increment access count if analytics enabled
    if (this.config.enableAnalytics) {
      const result = await pool.query(
        'UPDATE urls SET clicks = clicks + 1, updated_at = CURRENT_TIMESTAMP WHERE short_code = $1 RETURNING *',
        [shortCode]
      );

      if (result.rows.length === 0) {
        logger.debug('Short code not found', { shortCode });
        return null;
      }

      const row = result.rows[0];
      logger.debug('Updated analytics', { shortCode, accessCount: row.clicks });

      return {
        shortCode: row.short_code,
        originalUrl: row.original_url,
        createdAt: row.created_at,
        accessCount: row.clicks,
        lastAccessedAt: row.updated_at,
      };
    } else {
      // Just fetch without updating
      const result = await pool.query(
        'SELECT * FROM urls WHERE short_code = $1',
        [shortCode]
      );

      if (result.rows.length === 0) {
        logger.debug('Short code not found', { shortCode });
        return null;
      }

      const row = result.rows[0];
      return {
        shortCode: row.short_code,
        originalUrl: row.original_url,
        createdAt: row.created_at,
        accessCount: row.clicks,
      };
    }
  }

  /**
   * Gets analytics for a short URL (if analytics enabled)
   * @param shortCode - The short code to get analytics for
   * @returns Analytics data or null if not found
   */
  async getAnalytics(shortCode: string): Promise<UrlAnalytics | null> {
    if (!this.config.enableAnalytics) {
      throw new Error('Analytics feature is not enabled');
    }

    const result = await pool.query(
      'SELECT * FROM urls WHERE short_code = $1',
      [shortCode]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      shortCode: row.short_code,
      originalUrl: row.original_url,
      accessCount: row.clicks,
      createdAt: row.created_at,
      lastAccessedAt: row.updated_at,
    };
  }

  /**
   * Deletes a short URL
   * @param shortCode - The short code to delete
   * @returns True if deleted, false if not found
   */
  async deleteShortUrl(shortCode: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM urls WHERE short_code = $1 RETURNING *',
      [shortCode]
    );

    const deleted = result.rows.length > 0;

    if (deleted) {
      logger.info('Short URL deleted', { shortCode });
    } else {
      logger.debug('Short code not found for deletion', { shortCode });
    }

    return deleted;
  }

  /**
   * Generates a unique short code that doesn't exist in storage
   * @returns A unique short code
   */
  private async generateUniqueShortCode(): Promise<string> {
    let shortCode: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      shortCode = this.generateId();
      attempts++;

      if (attempts >= maxAttempts) {
        logger.error('Failed to generate unique short code', { attempts });
        throw new Error('Failed to generate unique short code');
      }

      // Check if short code exists in database
      const result = await pool.query(
        'SELECT short_code FROM urls WHERE short_code = $1',
        [shortCode]
      );

      if (result.rows.length === 0) {
        break;
      }
    } while (true);

    return shortCode;
  }

  /**
   * Gets total number of stored URLs
   * @returns Count of URLs in storage
   */
  async getUrlCount(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM urls');
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Clears all stored URLs (useful for testing)
   */
  async clearAll(): Promise<void> {
    await pool.query('DELETE FROM urls');
    logger.warn('All URLs cleared from storage');
  }
}
