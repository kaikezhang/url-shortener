# Deployment Guide

## Railway Deployment

### Environment Setup

#### Production Environment Variables

Required environment variables for production:

```bash
# Core
NODE_ENV=production
PORT=3000
BASE_URL=https://short-url-production-237f.up.railway.app

# Features
ENABLE_ANALYTICS=true
ENABLE_CUSTOM_CODES=true
ENABLE_RATE_LIMITING=true
ENABLE_CACHING=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=1000
RATE_LIMIT_MAX_REQUESTS=200

# Database (Auto-populated by Railway Postgres plugin)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_POOL_MIN=5
DB_POOL_MAX=50

# Redis (Auto-populated by Railway Redis plugin)
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_TTL=3600
REDIS_KEY_PREFIX=urlshort:
```

#### Staging Environment Variables

```bash
# Core
NODE_ENV=staging
PORT=3000
BASE_URL=https://short-url-staging.up.railway.app

# Features
ENABLE_ANALYTICS=true
ENABLE_CUSTOM_CODES=true
ENABLE_RATE_LIMITING=false
ENABLE_CACHING=true

# Database (Auto-populated by Railway Postgres plugin)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_POOL_MIN=2
DB_POOL_MAX=20

# Redis (Auto-populated by Railway Redis plugin)
REDIS_URL=${{Redis.REDIS_URL}}
REDIS_TTL=3600
REDIS_KEY_PREFIX=urlshort:staging:
```

---

## Running Migrations on Railway

### Option 1: Automatic (Recommended)

Migrations run automatically via \`nixpacks.toml\`.

**Production:**
- Railway will use: \`npm run start:migrate\`
- Runs migrations, then starts server

**Staging:**
- Set Railway custom start command to: \`npm run start:migrate:staging\`

### Option 2: Manual Execution

**Railway Dashboard:**
1. Service → Settings → Deploy → "Run a Command"
2. Enter: \`npm run migrate:prod\` or \`npm run migrate:staging\`
3. Click Run

---

## Performance Optimizations Included

- Redis caching (1hr TTL)
- Increased DB pool: 10 → 50 connections
- Async analytics updates
- Response compression (gzip)
- Optimized queries

**Expected Results:**
- Throughput: 40 → 150-200 req/s
- Latency (cached): 230ms → 10-50ms
- DB Load: -80-95%
