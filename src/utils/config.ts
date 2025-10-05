import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Application configuration loaded from environment variables
 */
export const config = {
  // Server configuration
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',

  // Feature flags
  features: {
    analytics: process.env.ENABLE_ANALYTICS === 'true',
    customCodes: process.env.ENABLE_CUSTOM_CODES === 'true',
    rateLimiting: process.env.ENABLE_RATE_LIMITING === 'true',
  },

  // Rate limiting configuration (if enabled)
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // URL shortener configuration
  urlShortener: {
    shortCodeLength: 7, // Length of generated short codes
  },
} as const;

/**
 * Validates that required configuration is present
 */
export function validateConfig(): void {
  if (!config.baseUrl) {
    throw new Error('BASE_URL environment variable is required');
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }
}
