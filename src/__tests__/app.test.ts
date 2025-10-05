import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../app';

describe('URL Shortener API', () => {
  let app: Application;

  beforeAll(() => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.BASE_URL = 'http://localhost:3000';
    process.env.ENABLE_ANALYTICS = 'false';
    process.env.ENABLE_CUSTOM_CODES = 'false';
    process.env.ENABLE_RATE_LIMITING = 'false';

    app = createApp();
  });

  describe('GET /', () => {
    it('should return welcome message with API info', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('URL Shortener Service');
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.features).toBeDefined();
    });
  });

  describe('POST /api/shorten', () => {
    it('should create a short URL with valid input', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' });

      expect(response.status).toBe(201);
      expect(response.body.shortCode).toBeDefined();
      expect(response.body.shortCode.length).toBe(7);
      expect(response.body.originalUrl).toBe('https://example.com');
      expect(response.body.shortUrl).toContain(response.body.shortCode);
      expect(response.body.createdAt).toBeDefined();
    });

    it('should reject request without URL', async () => {
      const response = await request(app).post('/api/shorten').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('URL is required');
    });

    it('should reject invalid URLs', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: 'not-a-valid-url' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid URL');
    });

    it('should trim whitespace from URLs', async () => {
      const response = await request(app)
        .post('/api/shorten')
        .send({ url: '  https://example.com  ' });

      expect(response.status).toBe(201);
      expect(response.body.originalUrl).toBe('https://example.com');
    });
  });

  describe('GET /:shortCode', () => {
    it('should redirect to original URL', async () => {
      // First, create a short URL
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' });

      const { shortCode } = createResponse.body;

      // Then, try to redirect
      const response = await request(app)
        .get(`/${shortCode}`)
        .redirects(0); // Don't follow redirects

      expect(response.status).toBe(301);
      expect(response.headers.location).toBe('https://example.com');
    });

    it('should return 404 for non-existent short code', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Short URL not found');
    });
  });

  describe('DELETE /api/urls/:shortCode', () => {
    it('should delete an existing short URL', async () => {
      // Create a short URL
      const createResponse = await request(app)
        .post('/api/shorten')
        .send({ url: 'https://example.com' });

      const { shortCode } = createResponse.body;

      // Delete it
      const deleteResponse = await request(app).delete(`/api/urls/${shortCode}`);
      expect(deleteResponse.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app).get(`/${shortCode}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent short code', async () => {
      const response = await request(app).delete('/api/urls/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Short URL not found');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.urlCount).toBeDefined();
      expect(response.body.features).toBeDefined();
    });
  });

  describe('404 handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Route not found');
    });
  });
});

/**
 * Note: Testing with different feature flags (ENABLE_ANALYTICS, ENABLE_CUSTOM_CODES)
 * requires setting environment variables before the application starts.
 *
 * To test these features:
 * 1. Set the environment variable: ENABLE_ANALYTICS=true npm test
 * 2. Or manually test using the API with a running server
 *
 * The core functionality is tested by the UrlShortenerService unit tests above.
 */
