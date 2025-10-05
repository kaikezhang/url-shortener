# URL Shortener API Documentation

Complete API reference for the URL Shortener Service.

## Base URL

```
http://localhost:3000
```

Replace with your deployed URL in production.

## Authentication

Currently, the API does not require authentication. In production, consider adding API keys or OAuth for create/delete operations.

---

## Endpoints

### 1. Get API Information

Get information about the API and available endpoints.

**Endpoint:** `GET /`

**Response:**
```json
{
  "name": "URL Shortener Service",
  "version": "1.0.0",
  "description": "Production-ready URL shortener with feature flags",
  "endpoints": {
    "shorten": "POST /api/shorten",
    "redirect": "GET /:shortCode",
    "analytics": "GET /api/analytics/:shortCode",
    "delete": "DELETE /api/urls/:shortCode",
    "health": "GET /api/health"
  },
  "features": {
    "analytics": false,
    "customCodes": false,
    "rateLimiting": false
  }
}
```

---

### 2. Create Short URL

Create a new shortened URL.

**Endpoint:** `POST /api/shorten`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "url": "https://www.example.com/very/long/url",
  "customCode": "mylink"  // Optional, requires ENABLE_CUSTOM_CODES=true
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | The URL to shorten. Must be a valid HTTP/HTTPS URL. |
| `customCode` | string | No | Custom short code (3-20 alphanumeric characters, hyphens, or underscores). Requires `ENABLE_CUSTOM_CODES=true`. |

**Success Response (201 Created):**
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://www.example.com/very/long/url",
  "shortUrl": "http://localhost:3000/abc123",
  "createdAt": "2025-10-05T12:00:00.000Z"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid URL or custom code
  ```json
  {
    "error": "Invalid URL provided",
    "statusCode": 400
  }
  ```

- **403 Forbidden** - Custom codes not enabled
  ```json
  {
    "error": "Custom short codes are not enabled",
    "statusCode": 403
  }
  ```

- **409 Conflict** - Custom code already exists
  ```json
  {
    "error": "Custom short code already exists",
    "statusCode": 409
  }
  ```

**Examples:**

```bash
# Basic URL shortening
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com"}'

# With custom short code (requires feature flag)
curl -X POST http://localhost:3000/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "customCode": "gh"}'
```

---

### 3. Redirect to Original URL

Redirect from a short code to the original URL.

**Endpoint:** `GET /:shortCode`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `shortCode` | string | The short code to redirect from |

**Success Response (301 Permanent Redirect):**

Redirects to the original URL with HTTP 301 status code.

**Error Response:**

- **404 Not Found** - Short code doesn't exist
  ```json
  {
    "error": "Short URL not found",
    "statusCode": 404
  }
  ```

**Examples:**

```bash
# Redirect to original URL
curl -L http://localhost:3000/abc123

# Without following redirects (to see the 301)
curl -I http://localhost:3000/abc123
```

---

### 4. Get Analytics

Get analytics data for a shortened URL. Requires `ENABLE_ANALYTICS=true`.

**Endpoint:** `GET /api/analytics/:shortCode`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `shortCode` | string | The short code to get analytics for |

**Success Response (200 OK):**
```json
{
  "shortCode": "abc123",
  "originalUrl": "https://www.example.com",
  "accessCount": 42,
  "createdAt": "2025-10-05T12:00:00.000Z",
  "lastAccessedAt": "2025-10-05T14:30:00.000Z"
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `shortCode` | string | The short code |
| `originalUrl` | string | The original URL |
| `accessCount` | number | Total number of times the short URL was accessed |
| `createdAt` | string | ISO 8601 timestamp when the URL was created |
| `lastAccessedAt` | string | ISO 8601 timestamp of the last access (null if never accessed) |

**Error Responses:**

- **403 Forbidden** - Analytics feature not enabled
  ```json
  {
    "error": "Analytics feature is not enabled",
    "statusCode": 403
  }
  ```

- **404 Not Found** - Short code doesn't exist
  ```json
  {
    "error": "Short URL not found",
    "statusCode": 404
  }
  ```

**Examples:**

```bash
curl http://localhost:3000/api/analytics/abc123
```

---

### 5. Delete Short URL

Delete a shortened URL.

**Endpoint:** `DELETE /api/urls/:shortCode`

**URL Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `shortCode` | string | The short code to delete |

**Success Response (204 No Content):**

Empty response body with HTTP 204 status code.

**Error Response:**

- **404 Not Found** - Short code doesn't exist
  ```json
  {
    "error": "Short URL not found",
    "statusCode": 404
  }
  ```

**Examples:**

```bash
curl -X DELETE http://localhost:3000/api/urls/abc123
```

---

### 6. Health Check

Check the health status of the service.

**Endpoint:** `GET /api/health`

**Success Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "urlCount": 10,
  "features": {
    "analytics": false,
    "customCodes": false,
    "rateLimiting": false
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Health status ("healthy") |
| `timestamp` | string | Current server time (ISO 8601) |
| `urlCount` | number | Total number of URLs in the system |
| `features` | object | Enabled feature flags |

**Examples:**

```bash
curl http://localhost:3000/api/health
```

---

## Error Handling

All errors follow a consistent JSON format:

```json
{
  "error": "Human-readable error message",
  "statusCode": 400,
  "details": "Additional error details (optional)"
}
```

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Resource deleted successfully |
| 301 | Permanent Redirect - Redirecting to original URL |
| 400 | Bad Request - Invalid request data |
| 403 | Forbidden - Feature not enabled |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

When `ENABLE_RATE_LIMITING=true`, requests are limited per IP address.

**Default Limits:**
- Window: 15 minutes
- Max Requests: 100

**Rate Limit Headers:**

When rate limited, you'll receive a 429 response:

```json
{
  "error": "Too many requests, please try again later",
  "statusCode": 429,
  "details": "Rate limit: 100 requests per 900 seconds"
}
```

**Configuration:**

Set these environment variables to adjust rate limits:

```env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes in milliseconds
RATE_LIMIT_MAX_REQUESTS=100      # Maximum requests per window
```

---

## Feature Flags

The API supports feature flags that can be enabled/disabled via environment variables.

### Analytics

**Environment Variable:** `ENABLE_ANALYTICS=true`

**Enables:**
- Access count tracking
- Last access timestamp
- `/api/analytics/:shortCode` endpoint

### Custom Short Codes

**Environment Variable:** `ENABLE_CUSTOM_CODES=true`

**Enables:**
- Custom short code parameter in `/api/shorten`
- User-defined short codes (3-20 characters)

### Rate Limiting

**Environment Variable:** `ENABLE_RATE_LIMITING=true`

**Enables:**
- Request rate limiting per IP address
- Configurable window and max requests

---

## Examples with Different Languages

### JavaScript (fetch)

```javascript
// Create short URL
const response = await fetch('http://localhost:3000/api/shorten', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://github.com'
  })
});

const data = await response.json();
console.log(data.shortUrl);
```

### Python (requests)

```python
import requests

# Create short URL
response = requests.post(
    'http://localhost:3000/api/shorten',
    json={'url': 'https://github.com'}
)

data = response.json()
print(data['shortUrl'])
```

### Go

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]string{"url": "https://github.com"}
    jsonData, _ := json.Marshal(payload)

    resp, _ := http.Post(
        "http://localhost:3000/api/shorten",
        "application/json",
        bytes.NewBuffer(jsonData),
    )

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)
    fmt.Println(result["shortUrl"])
}
```

---

## Best Practices

1. **Always validate URLs** before submitting to the API
2. **Handle errors gracefully** in your application
3. **Use HTTPS** in production
4. **Implement retry logic** for transient failures
5. **Cache short URLs** to reduce API calls
6. **Monitor rate limits** if enabled
7. **Use meaningful custom codes** for better user experience
8. **Check health endpoint** for monitoring

---

## Changelog

### Version 1.0.0 (2025-10-05)
- Initial release
- Basic URL shortening
- Optional analytics
- Optional custom codes
- Optional rate limiting
- Docker support
