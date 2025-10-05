/**
 * Represents a shortened URL entry
 */
export interface UrlEntry {
  /** The short code identifier */
  shortCode: string;
  /** The original long URL */
  originalUrl: string;
  /** Timestamp when the URL was created */
  createdAt: Date;
  /** Number of times this short URL has been accessed */
  accessCount: number;
  /** Last time the URL was accessed (optional, for analytics) */
  lastAccessedAt?: Date;
}

/**
 * Request body for creating a short URL
 */
export interface CreateShortUrlRequest {
  /** The URL to shorten */
  url: string;
  /** Optional custom short code (requires ENABLE_CUSTOM_CODES feature flag) */
  customCode?: string;
}

/**
 * Response for a successfully created short URL
 */
export interface CreateShortUrlResponse {
  /** The generated or custom short code */
  shortCode: string;
  /** The original URL */
  originalUrl: string;
  /** The full shortened URL */
  shortUrl: string;
  /** Timestamp when created */
  createdAt: string;
}

/**
 * Analytics data for a short URL (optional feature)
 */
export interface UrlAnalytics {
  /** The short code */
  shortCode: string;
  /** The original URL */
  originalUrl: string;
  /** Total number of accesses */
  accessCount: number;
  /** When the URL was created */
  createdAt: Date;
  /** Last access time */
  lastAccessedAt?: Date;
}

/**
 * Configuration for the URL shortener service
 */
export interface UrlShortenerConfig {
  /** Length of generated short codes */
  shortCodeLength: number;
  /** Enable analytics tracking */
  enableAnalytics: boolean;
  /** Enable custom short codes */
  enableCustomCodes: boolean;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  /** Error message */
  error: string;
  /** HTTP status code */
  statusCode: number;
  /** Additional error details (optional) */
  details?: string;
}
