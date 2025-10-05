# Database Setup Guide

This guide explains how to set up and use the PostgreSQL persistence layer for the URL Shortener service.

## Prerequisites

- PostgreSQL 16+ (or use Docker Compose)
- Node.js and npm installed

## Quick Start with Docker Compose

The easiest way to get started is using Docker Compose, which includes a PostgreSQL container:

```bash
# Start PostgreSQL container
docker compose up -d postgres

# Wait for PostgreSQL to be ready (check health status)
docker compose ps

# Start the application
npm run dev
```

## Manual PostgreSQL Setup

If you prefer to use a local PostgreSQL installation:

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE url_shortener;

# Exit psql
\q
```

### 2. Configure Environment Variables

Update the `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=url_shortener
DB_USER=postgres
DB_PASSWORD=your_password
DB_POOL_MIN=2
DB_POOL_MAX=10
```

The database schema is automatically created on first run.

## Database Schema

### `urls` Table

Stores URL mappings and metadata:

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary key |
| `short_code` | VARCHAR(20) | Unique short code for the URL |
| `original_url` | TEXT | The original long URL |
| `created_at` | TIMESTAMP | When the URL was created |
| `updated_at` | TIMESTAMP | When the URL was last updated |
| `clicks` | INTEGER | Number of times the short URL was accessed |
| `metadata` | JSONB | Additional metadata (e.g., custom settings) |

**Indexes:**
- `idx_urls_short_code` on `short_code` (for fast lookups)
- `idx_urls_created_at` on `created_at` (for analytics)

## Connection Pooling

The application uses `pg` connection pooling with the following configuration:

- **Min connections**: 2 (configurable via `DB_POOL_MIN`)
- **Max connections**: 10 (configurable via `DB_POOL_MAX`)
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds

The pool automatically:
- Manages connections efficiently
- Handles connection errors
- Logs connection events for monitoring

## Using the Database in Code

### Import the Pool

```typescript
import { pool } from './database';

// Execute a query
const result = await pool.query('SELECT * FROM urls WHERE short_code = $1', [code]);

// Use a transaction
const client = await pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO urls ...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

### Test Connection

```typescript
import { testConnection } from './database';

const isConnected = await testConnection();
if (isConnected) {
  console.log('Database connected successfully');
}
```

## Troubleshooting

### Connection Errors

If you see connection errors:

1. Verify PostgreSQL is running:
   ```bash
   # For Docker
   docker compose ps

   # For local PostgreSQL
   pg_isready -U postgres
   ```

2. Check your `.env` configuration matches your database setup

3. Verify network connectivity:
   ```bash
   telnet localhost 5432
   ```

### Performance Issues

If you experience slow queries:

1. Check connection pool settings in `.env`
2. Add indexes for frequently queried columns
3. Monitor pool usage with the built-in logging
4. Consider increasing `DB_POOL_MAX` for high-traffic scenarios

## Production Considerations

### Security

- **Never commit `.env` files** with production credentials
- Use environment variables or secret management systems
- Enable SSL connections for production databases
- Use strong passwords for database users

### Monitoring

The connection pool logs important events:
- New client connections
- Client removal from pool
- Unexpected errors

Monitor these logs to track database health.

### Backup

Regular backups are essential:

```bash
# Create backup
pg_dump -U postgres url_shortener > backup.sql

# Restore backup
psql -U postgres url_shortener < backup.sql
```

### High Availability

For production deployments:
- Use managed PostgreSQL services (AWS RDS, Google Cloud SQL, etc.)
- Configure read replicas for read-heavy workloads
- Set up automatic failover
- Monitor connection pool metrics

## Next Steps

- [ ] Integrate database with UrlShortenerService
- [ ] Add database repository layer
- [ ] Implement caching layer (Redis) for frequently accessed URLs
- [ ] Add analytics tracking
- [ ] Set up database monitoring and alerting
