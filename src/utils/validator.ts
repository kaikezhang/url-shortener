/**
 * Validates if a string is a valid URL
 * @param url - The URL string to validate
 * @returns True if valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates if a custom short code is valid
 * @param code - The short code to validate
 * @returns True if valid, false otherwise
 */
export function isValidShortCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }

  // Short code should be alphanumeric and between 3-20 characters
  const regex = /^[a-zA-Z0-9_-]{3,20}$/;
  return regex.test(code);
}

/**
 * Sanitizes a URL by trimming whitespace
 * @param url - The URL to sanitize
 * @returns Sanitized URL
 */
export function sanitizeUrl(url: string): string {
  return url.trim();
}
