import { Router, Request, Response, NextFunction } from 'express';
import { UrlShortenerService } from '../services/UrlShortenerService';
import { CreateShortUrlRequest, CreateShortUrlResponse } from '../types';
import { config } from '../utils/config';
import { sanitizeUrl } from '../utils/validator';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';

/**
 * Creates URL routes
 * @param urlService - Instance of UrlShortenerService
 */
export function createUrlRoutes(urlService: UrlShortenerService): Router {
  const router = Router();

  /**
   * POST /api/shorten
   * Creates a shortened URL
   */
  router.post(
    '/shorten',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { url, customCode }: CreateShortUrlRequest = req.body;

        // Validate request body
        if (!url) {
          throw new ApiError(400, 'URL is required');
        }

        // Sanitize URL
        const sanitizedUrl = sanitizeUrl(url);

        // Create short URL
        const urlEntry = await urlService.createShortUrl(sanitizedUrl, customCode);

        // Build response
        const response: CreateShortUrlResponse = {
          shortCode: urlEntry.shortCode,
          originalUrl: urlEntry.originalUrl,
          shortUrl: `${config.baseUrl}/${urlEntry.shortCode}`,
          createdAt: urlEntry.createdAt.toISOString(),
        };

        logger.info('Short URL created via API', { shortCode: urlEntry.shortCode });
        res.status(201).json(response);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/analytics/:shortCode
   * Gets analytics for a short URL (if analytics enabled)
   */
  router.get(
    '/analytics/:shortCode',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { shortCode } = req.params;

        if (!shortCode) {
          throw new ApiError(400, 'Short code is required');
        }

        // Get analytics
        const analytics = await urlService.getAnalytics(shortCode);

        if (!analytics) {
          throw new ApiError(404, 'Short URL not found');
        }

        res.json(analytics);
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * DELETE /api/urls/:shortCode
   * Deletes a short URL
   */
  router.delete(
    '/urls/:shortCode',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { shortCode } = req.params;

        if (!shortCode) {
          throw new ApiError(400, 'Short code is required');
        }

        const deleted = await urlService.deleteShortUrl(shortCode);

        if (!deleted) {
          throw new ApiError(404, 'Short URL not found');
        }

        res.status(204).send();
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/health
   * Health check endpoint
   */
  router.get('/health', async (req: Request, res: Response): Promise<void> => {
    const urlCount = await urlService.getUrlCount();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      urlCount,
      features: config.features,
    });
  });

  /**
   * GET /api/metrics
   * Application metrics endpoint for monitoring
   */
  router.get('/metrics', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const urlService = req.app.locals.urlService;
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();

      // Get basic stats from database
      const statsQuery = `
        SELECT
          COUNT(*) as total_urls,
          SUM(clicks) as total_clicks,
          COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as urls_created_today,
          COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as urls_created_this_week,
          SUM(CASE WHEN updated_at >= CURRENT_DATE THEN clicks ELSE 0 END) as clicks_today,
          SUM(CASE WHEN updated_at >= CURRENT_DATE - INTERVAL '7 days' THEN clicks ELSE 0 END) as clicks_this_week
        FROM urls
      `;

      const pool = require('../database').pool;
      const result = await pool.query(statsQuery);
      const stats = result.rows[0];

      res.json({
        urls: {
          total: parseInt(stats.total_urls, 10),
          created_today: parseInt(stats.urls_created_today, 10),
          created_this_week: parseInt(stats.urls_created_this_week, 10),
        },
        clicks: {
          total: parseInt(stats.total_clicks || 0, 10),
          today: parseInt(stats.clicks_today || 0, 10),
          this_week: parseInt(stats.clicks_this_week || 0, 10),
        },
        performance: {
          uptime_seconds: Math.floor(uptime),
          memory_usage_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
          memory_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
        },
        database: {
          status: 'connected',
          pool_size: pool.totalCount || 0,
          active_connections: pool.idleCount || 0,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

/**
 * Creates redirect route (handles short code redirects)
 * @param urlService - Instance of UrlShortenerService
 */
export function createRedirectRoute(urlService: UrlShortenerService): Router {
  const router = Router();

  /**
   * GET /:shortCode
   * Redirects to the original URL
   */
  router.get(
    '/:shortCode',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { shortCode } = req.params;

        if (!shortCode) {
          throw new ApiError(400, 'Short code is required');
        }

        // Get original URL
        const urlEntry = await urlService.getOriginalUrl(shortCode);

        if (!urlEntry) {
          throw new ApiError(404, 'Short URL not found');
        }

        logger.info('Redirecting', { shortCode, to: urlEntry.originalUrl });

        // Redirect to original URL (301 = permanent redirect)
        res.redirect(301, urlEntry.originalUrl);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
