import { Request, Response, NextFunction } from 'express';
import { config } from '../utils/config';
import { logger } from '../utils/logger';
import { ApiError } from './errorHandler';

/**
 * Simple in-memory rate limiter
 * In production, use Redis or a dedicated rate limiting service
 */
class RateLimiter {
  private requests: Map<string, number[]>;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.requests = new Map();
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Checks if a request should be allowed
   * @param identifier - Unique identifier (e.g., IP address)
   * @returns True if allowed, false if rate limit exceeded
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    let requestTimestamps = this.requests.get(identifier) || [];

    // Filter out requests outside the current window
    requestTimestamps = requestTimestamps.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (requestTimestamps.length >= this.maxRequests) {
      logger.warn('Rate limit exceeded', { identifier, count: requestTimestamps.length });
      return false;
    }

    // Add current request
    requestTimestamps.push(now);
    this.requests.set(identifier, requestTimestamps);

    return true;
  }

  /**
   * Cleans up old entries from the map
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(ts => ts > windowStart);

      if (validTimestamps.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validTimestamps);
      }
    }
  }
}

// Create rate limiter instance (only if enabled)
const rateLimiter = config.features.rateLimiting
  ? new RateLimiter(config.rateLimit.windowMs, config.rateLimit.maxRequests)
  : null;

/**
 * Rate limiting middleware
 * Only applies if ENABLE_RATE_LIMITING feature flag is true
 */
export function rateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Skip if rate limiting is disabled
  if (!config.features.rateLimiting || !rateLimiter) {
    return next();
  }

  // Use IP address as identifier (use user ID in production with authentication)
  const identifier = req.ip || req.socket.remoteAddress || 'unknown';

  if (!rateLimiter.isAllowed(identifier)) {
    throw new ApiError(
      429,
      'Too many requests, please try again later',
      `Rate limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 1000} seconds`
    );
  }

  next();
}
