import { UrlShortenerService } from '../UrlShortenerService';
import { UrlShortenerConfig } from '../../types';

describe('UrlShortenerService', () => {
  let service: UrlShortenerService;

  const defaultConfig: UrlShortenerConfig = {
    shortCodeLength: 7,
    enableAnalytics: false,
    enableCustomCodes: false,
  };

  beforeEach(() => {
    service = new UrlShortenerService(defaultConfig);
  });

  describe('createShortUrl', () => {
    it('should create a short URL with valid input', async () => {
      const url = 'https://example.com';
      const result = await service.createShortUrl(url);

      expect(result.shortCode).toBeDefined();
      expect(result.shortCode.length).toBe(7);
      expect(result.originalUrl).toBe(url);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.accessCount).toBe(0);
    });

    it('should generate unique short codes', async () => {
      const url1 = 'https://example.com/1';
      const url2 = 'https://example.com/2';

      const result1 = await service.createShortUrl(url1);
      const result2 = await service.createShortUrl(url2);

      expect(result1.shortCode).not.toBe(result2.shortCode);
    });

    it('should reject invalid URLs', async () => {
      await expect(service.createShortUrl('not-a-url')).rejects.toThrow('Invalid URL');
      await expect(service.createShortUrl('')).rejects.toThrow('Invalid URL');
      await expect(service.createShortUrl('ftp://example.com')).rejects.toThrow('Invalid URL');
    });

    it('should reject custom codes when feature is disabled', async () => {
      await expect(
        service.createShortUrl('https://example.com', 'custom')
      ).rejects.toThrow('Custom short codes are not enabled');
    });

    describe('with custom codes enabled', () => {
      beforeEach(() => {
        const config: UrlShortenerConfig = {
          ...defaultConfig,
          enableCustomCodes: true,
        };
        service = new UrlShortenerService(config);
      });

      it('should accept valid custom short codes', async () => {
        const url = 'https://example.com';
        const customCode = 'mycode';

        const result = await service.createShortUrl(url, customCode);

        expect(result.shortCode).toBe(customCode);
        expect(result.originalUrl).toBe(url);
      });

      it('should reject invalid custom short codes', async () => {
        const url = 'https://example.com';

        await expect(service.createShortUrl(url, 'ab')).rejects.toThrow('Invalid custom short code');
        await expect(service.createShortUrl(url, 'a b')).rejects.toThrow('Invalid custom short code');
        await expect(service.createShortUrl(url, 'a@b')).rejects.toThrow('Invalid custom short code');
      });

      it('should reject duplicate custom short codes', async () => {
        const url = 'https://example.com';
        const customCode = 'mycode';

        await service.createShortUrl(url, customCode);
        await expect(service.createShortUrl(url, customCode)).rejects.toThrow(
          'Custom short code already exists'
        );
      });
    });
  });

  describe('getOriginalUrl', () => {
    it('should retrieve the original URL for a valid short code', async () => {
      const url = 'https://example.com';
      const created = await service.createShortUrl(url);

      const result = await service.getOriginalUrl(created.shortCode);

      expect(result).toBeDefined();
      expect(result?.originalUrl).toBe(url);
    });

    it('should return null for non-existent short codes', async () => {
      const result = await service.getOriginalUrl('nonexistent');
      expect(result).toBeNull();
    });

    it('should not increment access count when analytics is disabled', async () => {
      const url = 'https://example.com';
      const created = await service.createShortUrl(url);

      await service.getOriginalUrl(created.shortCode);
      await service.getOriginalUrl(created.shortCode);

      const result = await service.getOriginalUrl(created.shortCode);
      expect(result?.accessCount).toBe(0);
    });

    describe('with analytics enabled', () => {
      beforeEach(() => {
        const config: UrlShortenerConfig = {
          ...defaultConfig,
          enableAnalytics: true,
        };
        service = new UrlShortenerService(config);
      });

      it('should increment access count when analytics is enabled', async () => {
        const url = 'https://example.com';
        const created = await service.createShortUrl(url);

        await service.getOriginalUrl(created.shortCode);
        await service.getOriginalUrl(created.shortCode);

        const result = await service.getOriginalUrl(created.shortCode);
        expect(result?.accessCount).toBe(3);
      });

      it('should update lastAccessedAt when analytics is enabled', async () => {
        const url = 'https://example.com';
        const created = await service.createShortUrl(url);

        const result = await service.getOriginalUrl(created.shortCode);
        expect(result?.lastAccessedAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('getAnalytics', () => {
    it('should throw error when analytics is disabled', async () => {
      await expect(service.getAnalytics('test')).rejects.toThrow(
        'Analytics feature is not enabled'
      );
    });

    describe('with analytics enabled', () => {
      beforeEach(() => {
        const config: UrlShortenerConfig = {
          ...defaultConfig,
          enableAnalytics: true,
        };
        service = new UrlShortenerService(config);
      });

      it('should return analytics for existing short code', async () => {
        const url = 'https://example.com';
        const created = await service.createShortUrl(url);

        await service.getOriginalUrl(created.shortCode);
        await service.getOriginalUrl(created.shortCode);

        const analytics = await service.getAnalytics(created.shortCode);

        expect(analytics).toBeDefined();
        expect(analytics?.shortCode).toBe(created.shortCode);
        expect(analytics?.originalUrl).toBe(url);
        expect(analytics?.accessCount).toBe(2);
        expect(analytics?.createdAt).toBeInstanceOf(Date);
        expect(analytics?.lastAccessedAt).toBeInstanceOf(Date);
      });

      it('should return null for non-existent short code', async () => {
        const analytics = await service.getAnalytics('nonexistent');
        expect(analytics).toBeNull();
      });
    });
  });

  describe('deleteShortUrl', () => {
    it('should delete an existing short URL', async () => {
      const url = 'https://example.com';
      const created = await service.createShortUrl(url);

      const deleted = await service.deleteShortUrl(created.shortCode);
      expect(deleted).toBe(true);

      const result = await service.getOriginalUrl(created.shortCode);
      expect(result).toBeNull();
    });

    it('should return false for non-existent short code', async () => {
      const deleted = await service.deleteShortUrl('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('getUrlCount', () => {
    it('should return the correct count of stored URLs', async () => {
      expect(await service.getUrlCount()).toBe(0);

      await service.createShortUrl('https://example.com/1');
      expect(await service.getUrlCount()).toBe(1);

      await service.createShortUrl('https://example.com/2');
      expect(await service.getUrlCount()).toBe(2);
    });
  });

  describe('clearAll', () => {
    it('should clear all stored URLs', async () => {
      await service.createShortUrl('https://example.com/1');
      await service.createShortUrl('https://example.com/2');

      expect(await service.getUrlCount()).toBe(2);

      await service.clearAll();
      expect(await service.getUrlCount()).toBe(0);
    });
  });
});
