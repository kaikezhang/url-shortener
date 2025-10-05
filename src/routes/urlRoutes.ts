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
