# Production Deployment Guide

This guide covers how to deploy the URL Shortener service to production and ensure database migrations run correctly.

## Table of Contents

- [Quick Start](#quick-start)
- [Deployment Methods](#deployment-methods)
- [Migration Strategies](#migration-strategies)
- [CI/CD Integration](#cicd-integration)
- [Rollback Procedures](#rollback-procedures)
- [Best Practices](#best-practices)

## Quick Start

### Using Docker Compose (Recommended for Testing)

```bash
# Pull latest code
git pull origin main

# Build and start services
docker compose up -d --build

# Check logs
docker compose logs -f url-shortener
```

The Docker container will automatically:
1. Wait for PostgreSQL to be ready
2. Run pending migrations
3. Start the application

### Manual Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Run migrations
npm run migrate:up

# 4. Build application
npm run build

# 5. Start/restart the application
pm2 restart url-shortener
# or
systemctl restart url-shortener
```

## Deployment Methods

### 1. Docker with Auto-Migration (Recommended)

The `docker-entrypoint.sh` script automatically runs migrations before starting the app.

**Pros:**
- Zero-downtime for backward-compatible migrations
- Automatic on every deployment
- Works with container orchestration (Docker Swarm, Kubernetes)

**Cons:**
- Increases container startup time
- All instances try to run migrations (use migration locking for multi-instance)

**Example:**
```bash
docker compose up -d --build
```

**Skip migrations if needed:**
```bash
docker run -e SKIP_MIGRATIONS=true your-image
```

### 2. Separate Migration Step

Run migrations as a separate step before deploying the application.

**Pros:**
- More control over migration timing
- Better for complex migrations
- Can verify migrations before app restart

**Cons:**
- Requires manual step or CI/CD integration
- Risk of forgetting to run migrations

**Example with Docker:**
```bash
# Run migration in a one-off container
docker run --rm \
  --network=url-shortener-network \
  -e DB_HOST=postgres \
  -e DB_NAME=url_shortener \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  your-image npm run migrate:up

# Then deploy the app
docker compose up -d --no-deps --build url-shortener
```

### 3. Database Migration Service (Advanced)

For large deployments, run migrations via a separate job/service.

**Kubernetes Example:**
```yaml
# migration-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: your-registry/url-shortener:latest
        command: ["npm", "run", "migrate:up"]
        env:
        - name: DB_HOST
          value: "postgres-service"
        # ... other env vars
      restartPolicy: Never
```

Run before deployment:
```bash
kubectl apply -f migration-job.yaml
kubectl wait --for=condition=complete job/db-migration
kubectl apply -f deployment.yaml
```

## Migration Strategies

### A. Forward-Only Migrations (Recommended)

Always write migrations that are backward-compatible with the running application version.

**Example Safe Migration:**
```sql
-- ✅ SAFE: Add nullable column
ALTER TABLE urls ADD COLUMN expires_at TIMESTAMP;

-- ✅ SAFE: Add new table
CREATE TABLE analytics (...);

-- ✅ SAFE: Add index
CREATE INDEX idx_urls_expires_at ON urls(expires_at);
```

**Example Unsafe Migration:**
```sql
-- ❌ UNSAFE: Removing column (old app will break)
ALTER TABLE urls DROP COLUMN clicks;

-- ❌ UNSAFE: Renaming column
ALTER TABLE urls RENAME COLUMN short_code TO code;
```

### B. Blue-Green Deployment with Migrations

For breaking changes, use multi-step deployments:

**Step 1: Add new column (keep old)**
```sql
ALTER TABLE urls ADD COLUMN new_column VARCHAR(100);
-- Copy data from old to new
UPDATE urls SET new_column = old_column;
```

**Step 2: Deploy app supporting both columns**

**Step 3: Remove old column**
```sql
ALTER TABLE urls DROP COLUMN old_column;
```

### C. Migration Locking (Multiple Instances)

If running multiple instances, ensure only one runs migrations:

**Option 1: Use advisory locks in migration**
```typescript
// At start of migration
await pool.query('SELECT pg_advisory_lock(123456)');

try {
  // Run migrations
} finally {
  await pool.query('SELECT pg_advisory_unlock(123456)');
}
```

**Option 2: Run migrations from single instance**
- Use Docker Swarm service with replicas=1
- Use Kubernetes Job (not Deployment)
- Set SKIP_MIGRATIONS=true on worker instances

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Database Migrations
        run: |
          # SSH to production and run migrations
          ssh ${{ secrets.PROD_SERVER }} << 'EOF'
            cd /app/url-shortener
            git pull origin main
            npm install
            npm run migrate:up
          EOF

      - name: Deploy Application
        run: |
          ssh ${{ secrets.PROD_SERVER }} << 'EOF'
            cd /app/url-shortener
            npm run build
            pm2 reload url-shortener
          EOF

      - name: Health Check
        run: |
          curl -f https://yourapp.com/api/health || exit 1
```

### GitLab CI Example

```yaml
# .gitlab-ci.yml
stages:
  - migrate
  - deploy

migrate:
  stage: migrate
  script:
    - ssh $PROD_SERVER "cd /app && npm run migrate:up"
  only:
    - main

deploy:
  stage: deploy
  script:
    - ssh $PROD_SERVER "cd /app && npm run build && pm2 reload app"
  only:
    - main
```

## Rollback Procedures

### Rolling Back Migrations

**Check migration status:**
```bash
# Connect to database
psql -U postgres -d url_shortener

# View executed migrations
SELECT * FROM migrations ORDER BY id DESC;
```

**Rollback last migration:**
```bash
npm run migrate:down
```

**⚠️ WARNING:** Only rollback if:
- Migration just ran and app isn't deployed yet
- You have a proper `down()` migration defined
- No data loss will occur

### Rolling Back Application

**If migration succeeded but app is broken:**

```bash
# Revert to previous version
git checkout <previous-commit>
npm install
npm run build
pm2 restart url-shortener
```

**If migration failed:**

```bash
# Fix migration file
# Rollback failed migration (if partially applied)
npm run migrate:down

# Update migration
# Rerun migration
npm run migrate:up
```

## Best Practices

### 1. **Test Migrations on Staging First**

```bash
# Always test on staging environment
ssh staging-server
npm run migrate:up
# Verify app works
# Then deploy to production
```

### 2. **Backup Database Before Major Migrations**

```bash
# Create backup
pg_dump -U postgres url_shortener > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore if needed
psql -U postgres url_shortener < backup_20251005_120000.sql
```

### 3. **Monitor Migration Execution**

```bash
# Check migration logs
docker compose logs -f url-shortener | grep -i migration

# Or in production
tail -f /var/log/url-shortener/migration.log
```

### 4. **Use Idempotent Migrations**

Always use `IF NOT EXISTS` / `IF EXISTS`:

```sql
-- ✅ Good
CREATE TABLE IF NOT EXISTS analytics (...);
ALTER TABLE urls ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- ❌ Bad (fails on rerun)
CREATE TABLE analytics (...);
ALTER TABLE urls ADD COLUMN expires_at TIMESTAMP;
```

### 5. **Keep Migrations Small and Focused**

```typescript
// ✅ Good: One change per migration
// 002_add_expires_at.ts
// 003_add_analytics_table.ts
// 004_add_user_tracking.ts

// ❌ Bad: Multiple unrelated changes
// 002_big_migration.ts (adds 10 tables, modifies 5 others)
```

### 6. **Document Breaking Changes**

If a migration requires app downtime or special steps:

```typescript
/**
 * Migration: Rename short_code to code
 *
 * ⚠️ BREAKING CHANGE
 *
 * Requirements:
 * 1. Stop application before running
 * 2. Run migration
 * 3. Deploy new app version
 *
 * Estimated downtime: 5 minutes
 */
```

### 7. **Set Migration Timeout**

For long-running migrations on large tables:

```typescript
// Increase statement timeout for this migration
await pool.query('SET statement_timeout = 300000'); // 5 minutes
await pool.query('CREATE INDEX CONCURRENTLY ...');
```

### 8. **Use Connection Pooling Wisely**

Migrations use the same pool as the app. For production:

```env
# Ensure enough connections
DB_POOL_MAX=20  # Increase if needed

# Monitor connection usage
# SELECT count(*) FROM pg_stat_activity WHERE datname = 'url_shortener';
```

## Environment-Specific Configurations

### Production

```env
NODE_ENV=production
DB_HOST=prod-db.example.com
DB_NAME=url_shortener
DB_USER=prod_user
DB_PASSWORD=<strong-password>
DB_POOL_MIN=5
DB_POOL_MAX=20
```

### Staging

```env
NODE_ENV=staging
DB_HOST=staging-db.example.com
DB_NAME=url_shortener_staging
DB_USER=staging_user
DB_PASSWORD=<password>
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Development

```env
NODE_ENV=development
DB_HOST=localhost
DB_NAME=url_shortener
DB_USER=postgres
DB_PASSWORD=postgres
DB_POOL_MIN=2
DB_POOL_MAX=5
```

## Troubleshooting

### Migration Hangs or Times Out

```bash
# Check for locks
SELECT * FROM pg_locks WHERE NOT granted;

# Kill blocking queries
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'url_shortener' AND state = 'idle in transaction';
```

### "Migration Already Exists" Error

```bash
# Migration was recorded but didn't complete
# Manually remove from migrations table
psql -U postgres url_shortener
DELETE FROM migrations WHERE name = '002_problematic_migration';

# Then rerun
npm run migrate:up
```

### Connection Refused Errors

```bash
# Check PostgreSQL is running
docker compose ps postgres

# Check connection settings
echo $DB_HOST $DB_PORT $DB_NAME

# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

## Next Steps

- [ ] Set up staging environment
- [ ] Configure CI/CD pipeline for automated migrations
- [ ] Set up database backup schedule
- [ ] Configure monitoring and alerting
- [ ] Document rollback procedures for your team
- [ ] Test disaster recovery procedures
