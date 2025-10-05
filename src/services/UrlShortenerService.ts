import { customAlphabet } from 'nanoid';
import { UrlEntry, UrlAnalytics, UrlShortenerConfig } from '../types';
import { isValidUrl, isValidShortCode } from '../utils/validator';
import { logger } from '../utils/logger';

/**
 * Core URL Shortener Service
 * Handles creation, storage, and retrieval of shortened URLs
 */
export class UrlShortenerService {
  // In-memory storage (use Redis or database in production)
  private urlStore: Map<string, UrlEntry>;
  private config: UrlShortenerConfig;

  // Custom alphabet for nanoid (URL-safe characters)
  private generateId: () => string;

  constructor(config: UrlShortenerConfig) {
    this.urlStore = new Map();
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

      if (this.urlStore.has(customCode)) {
        throw new Error('Custom short code already exists');
      }

      shortCode = customCode;
      logger.info('Using custom short code', { shortCode, originalUrl });
    } else {
      // Generate unique short code
      shortCode = await this.generateUniqueShortCode();
      logger.debug('Generated short code', { shortCode, originalUrl });
    }

    // Create URL entry
    const urlEntry: UrlEntry = {
      shortCode,
      originalUrl,
      createdAt: new Date(),
      accessCount: 0,
    };

    // Store in map
    this.urlStore.set(shortCode, urlEntry);

    logger.info('Short URL created', { shortCode, originalUrl });
    return urlEntry;
  }

  /**
   * Retrieves the original URL for a short code
   * @param shortCode - The short code to look up
   * @returns The URL entry if found, null otherwise
   */
  async getOriginalUrl(shortCode: string): Promise<UrlEntry | null> {
    const urlEntry = this.urlStore.get(shortCode);

    if (!urlEntry) {
      logger.debug('Short code not found', { shortCode });
      return null;
    }

    // Increment access count if analytics enabled
    if (this.config.enableAnalytics) {
      urlEntry.accessCount++;
      urlEntry.lastAccessedAt = new Date();
      logger.debug('Updated analytics', { shortCode, accessCount: urlEntry.accessCount });
    }

    return urlEntry;
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

    const urlEntry = this.urlStore.get(shortCode);

    if (!urlEntry) {
      return null;
    }

    return {
      shortCode: urlEntry.shortCode,
      originalUrl: urlEntry.originalUrl,
      accessCount: urlEntry.accessCount,
      createdAt: urlEntry.createdAt,
      lastAccessedAt: urlEntry.lastAccessedAt,
    };
  }

  /**
   * Deletes a short URL
   * @param shortCode - The short code to delete
   * @returns True if deleted, false if not found
   */
  async deleteShortUrl(shortCode: string): Promise<boolean> {
    const deleted = this.urlStore.delete(shortCode);

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
    } while (this.urlStore.has(shortCode));

    return shortCode;
  }

  /**
   * Gets total number of stored URLs
   * @returns Count of URLs in storage
   */
  getUrlCount(): number {
    return this.urlStore.size;
  }

  /**
   * Clears all stored URLs (useful for testing)
   */
  clearAll(): void {
    this.urlStore.clear();
    logger.warn('All URLs cleared from storage');
  }
}
