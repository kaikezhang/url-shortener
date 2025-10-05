import express, { Application, Request, Response } from 'express';
import { UrlShortenerService } from './services/UrlShortenerService';
import { createUrlRoutes, createRedirectRoute } from './routes/urlRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimiter';
import { config } from './utils/config';
import { logger } from './utils/logger';

/**
 * Creates and configures the Express application
 */
export function createApp(): Application {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Apply rate limiting if enabled
  if (config.features.rateLimiting) {
    logger.info('Rate limiting enabled');
    app.use(rateLimitMiddleware);
  }

  // Initialize URL shortener service
  const urlService = new UrlShortenerService({
    shortCodeLength: config.urlShortener.shortCodeLength,
    enableAnalytics: config.features.analytics,
    enableCustomCodes: config.features.customCodes,
  });

  // Welcome route
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'URL Shortener Service',
      version: '1.0.0',
      description: 'Production-ready URL shortener with feature flags',
      endpoints: {
        shorten: 'POST /api/shorten',
        redirect: 'GET /:shortCode',
        analytics: 'GET /api/analytics/:shortCode',
        delete: 'DELETE /api/urls/:shortCode',
        health: 'GET /api/health',
      },
      features: config.features,
    });
  });

  // API routes
  app.use('/api', createUrlRoutes(urlService));

  // Redirect route (must be last to avoid conflicts)
  app.use('/', createRedirectRoute(urlService));

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
