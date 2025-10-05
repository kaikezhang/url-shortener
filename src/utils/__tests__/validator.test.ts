import { isValidUrl, isValidShortCode, sanitizeUrl } from '../validator';

describe('Validator Utils', () => {
  describe('isValidUrl', () => {
    it('should validate correct HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('http://www.example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
      expect(isValidUrl('http://example.com:8080')).toBe(true);
    });

    it('should validate correct HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://www.example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(isValidUrl(null as any)).toBe(false);
      expect(isValidUrl(undefined as any)).toBe(false);
      expect(isValidUrl(123 as any)).toBe(false);
      expect(isValidUrl({} as any)).toBe(false);
    });
  });

  describe('isValidShortCode', () => {
    it('should validate correct short codes', () => {
      expect(isValidShortCode('abc')).toBe(true);
      expect(isValidShortCode('ABC123')).toBe(true);
      expect(isValidShortCode('test-code')).toBe(true);
      expect(isValidShortCode('test_code')).toBe(true);
      expect(isValidShortCode('a1b2c3')).toBe(true);
    });

    it('should reject short codes that are too short', () => {
      expect(isValidShortCode('ab')).toBe(false);
      expect(isValidShortCode('a')).toBe(false);
    });

    it('should reject short codes that are too long', () => {
      expect(isValidShortCode('a'.repeat(21))).toBe(false);
    });

    it('should reject short codes with invalid characters', () => {
      expect(isValidShortCode('test code')).toBe(false);
      expect(isValidShortCode('test@code')).toBe(false);
      expect(isValidShortCode('test.code')).toBe(false);
      expect(isValidShortCode('test!code')).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(isValidShortCode(null as any)).toBe(false);
      expect(isValidShortCode(undefined as any)).toBe(false);
      expect(isValidShortCode(123 as any)).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('should trim whitespace from URLs', () => {
      expect(sanitizeUrl('  http://example.com  ')).toBe('http://example.com');
      expect(sanitizeUrl('\nhttp://example.com\n')).toBe('http://example.com');
      expect(sanitizeUrl('\thttp://example.com\t')).toBe('http://example.com');
    });

    it('should not modify URLs without whitespace', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });
  });
});
