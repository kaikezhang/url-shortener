# Staging Environment Setup Guide

This guide explains how to set up and use a staging environment for the URL Shortener service. Staging environments are essential for testing changes before deploying to production.

## Table of Contents

- [Why Use Staging?](#why-use-staging)
- [Local Staging Setup](#local-staging-setup)
- [Railway Staging Deployment](#railway-staging-deployment)
- [Testing in Staging](#testing-in-staging)
- [Promoting to Production](#promoting-to-production)

## Why Use Staging?

A staging environment provides:

- ✅ **Safe Testing**: Test new features without affecting production users
- ✅ **Integration Testing**: Verify database migrations and third-party integrations
- ✅ **Performance Testing**: Load test with production-like data
- ✅ **UAT Environment**: User acceptance testing before production release
- ✅ **Risk Mitigation**: Catch issues before they reach production

## Local Staging Setup

### Step 1: Create Staging Database

Create a separate database for staging to avoid conflicts with development:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create staging database
CREATE DATABASE url_shortener_staging;

# Exit psql
\q
```

### Step 2: Configure Staging Environment

```bash
# Copy staging environment template
cp .env.staging.example .env.staging

# Edit .env.staging with your local settings
# Update DB_PASSWORD and other values as needed
```

**Example `.env.staging` configuration:**

```env
PORT=3000
NODE_ENV=staging
BASE_URL=http://localhost:3000

# Enable all features for testing
ENABLE_ANALYTICS=true
ENABLE_CUSTOM_CODES=true
ENABLE_RATE_LIMITING=true

# Staging Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=url_shortener_staging
DB_USER=postgres
DB_PASSWORD=your_password
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Step 3: Run Staging Locally

```bash
# Start in staging mode (development with staging env)
npm run dev:staging

# Or build and run staging
npm run build
npm run start:staging
```

### Step 4: Verify Staging Setup

```bash
# Check health endpoint
curl http://localhost:3000/api/health

# Expected response shows staging configuration
{
  "status": "healthy",
  "timestamp": "2025-10-05T...",
  "urlCount": 0,
  "features": {
    "analytics": true,
    "customCodes": true,
    "rateLimiting": true
  }
}
```

## Railway Staging Deployment

### Option 1: Create Separate Staging Service

**Best Practice:** Create a completely separate Railway project for staging.

#### Steps:

1. **Create New Railway Project**
   - Go to [Railway](https://railway.app/)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Name it "url-shortener-staging"

2. **Add PostgreSQL Database**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway creates staging database automatically

3. **Configure Environment Variables**

   In Railway project → Variables tab:

   ```env
   # Database (auto-configured by Railway)
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_NAME=${{Postgres.PGDATABASE}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   DB_POOL_MIN=2
   DB_POOL_MAX=10

   # Application
   NODE_ENV=staging
   PORT=3000
   BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}

   # Enable all features for testing
   ENABLE_ANALYTICS=true
   ENABLE_CUSTOM_CODES=true
   ENABLE_RATE_LIMITING=true

   # More lenient rate limiting for testing
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=200
   ```

4. **Configure Deployment**

   Settings → Deploy:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`

5. **Set Up Branch Deployment**

   Settings → Deploy:
   - **Branch:** `staging` (or `develop`)
   - Auto-deploy when pushing to staging branch

### Option 2: Use Railway Environments

Railway supports multiple environments within a single project.

1. **In Railway Project**
   - Click on your service
   - Go to Settings → Environments
   - Click "New Environment"
   - Name it "staging"

2. **Configure Staging Environment**
   - Switch to staging environment
   - Add staging-specific variables
   - Deploy from `staging` branch

## Testing in Staging

### 1. Smoke Tests

Run basic functionality tests after deployment:

```bash
# Set staging URL
STAGING_URL="https://your-app-staging.up.railway.app"

# Health check
curl $STAGING_URL/api/health

# Create short URL
curl -X POST $STAGING_URL/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Test redirect
curl -L $STAGING_URL/abc123

# Test analytics (if enabled)
curl $STAGING_URL/api/analytics/abc123

# Test custom codes (if enabled)
curl -X POST $STAGING_URL/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "customCode": "gh-staging"}'
```

### 2. Integration Tests

Run full test suite against staging:

```bash
# Set staging URL in test environment
export API_URL=$STAGING_URL

# Run integration tests
npm test
```

### 3. Load Testing

Test performance with production-like load:

```bash
# Using Apache Bench
ab -n 1000 -c 10 $STAGING_URL/api/health

# Using wrk
wrk -t12 -c400 -d30s $STAGING_URL/api/health
```

### 4. Feature Testing Checklist

Before promoting to production, verify:

- [ ] All endpoints respond correctly
- [ ] Database migrations applied successfully
- [ ] Analytics tracking works (if enabled)
- [ ] Custom short codes work (if enabled)
- [ ] Rate limiting functions properly
- [ ] Error handling works as expected
- [ ] Logs are being generated correctly
- [ ] Health check passes
- [ ] No memory leaks or performance issues
- [ ] Security headers are present

## Promoting to Production

### Workflow Recommendation

```
Development → Staging → Production
     ↓            ↓          ↓
   feature/*   staging    main
```

### Step-by-Step Promotion

1. **Develop Feature**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git commit -m "feat: add new feature"
   git push origin feature/new-feature
   ```

2. **Merge to Staging**
   ```bash
   # Create PR: feature/new-feature → staging
   # After review, merge to staging branch
   git checkout staging
   git pull origin staging
   ```

3. **Test in Staging**
   - Automatic deployment to Railway staging
   - Run smoke tests
   - Perform manual QA
   - Verify all features work

4. **Promote to Production**
   ```bash
   # Only after staging tests pass
   # Create PR: staging → main
   # After review, merge to main
   git checkout main
   git merge staging
   git push origin main
   ```

### Rollback Strategy

If issues are found in staging:

```bash
# Revert the commit
git revert <commit-hash>
git push origin staging

# Or reset to previous version
git checkout staging
git reset --hard <previous-commit>
git push --force origin staging
```

## Staging vs Production Differences

| Aspect | Staging | Production |
|--------|---------|------------|
| **Environment** | `NODE_ENV=staging` | `NODE_ENV=production` |
| **Database** | Separate staging DB | Production DB |
| **Features** | All enabled for testing | Configured per need |
| **Rate Limit** | More lenient (200/15min) | Strict (100/15min) |
| **Data** | Test/synthetic data | Real user data |
| **Monitoring** | Optional | Required |
| **Uptime** | Not critical | Critical |
| **SSL** | Optional | Required |

## Best Practices

### 1. Keep Staging Updated

```bash
# Regularly sync staging with main
git checkout staging
git merge main
git push origin staging
```

### 2. Use Staging for All Changes

- Never merge directly to main
- All PRs should go through staging first
- Test thoroughly in staging

### 3. Separate Databases

- Never connect staging to production database
- Use separate databases to prevent data corruption
- Refresh staging data periodically from production (anonymized)

### 4. Monitor Staging

- Set up basic monitoring in staging
- Track errors and performance
- Use staging logs for debugging

### 5. Automate Testing

```yaml
# .github/workflows/staging.yml
name: Staging Deployment

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: npm test
      - name: Deploy to Railway Staging
        # Railway auto-deploys on push
      - name: Run smoke tests
        run: |
          sleep 30
          curl -f $STAGING_URL/api/health
```

### 6. Environment Parity

Keep staging as close to production as possible:
- Same Node.js version
- Same dependencies
- Similar resource limits
- Same database version

## Troubleshooting

### Staging Database Connection Failed

```bash
# Check database exists
psql -U postgres -l | grep url_shortener_staging

# If missing, create it
createdb -U postgres url_shortener_staging

# Verify connection
psql -U postgres -d url_shortener_staging
```

### Staging Shows Production Data

**CRITICAL:** You're connected to the wrong database!

```bash
# Check your .env.staging
cat .env.staging | grep DB_NAME

# Should be: url_shortener_staging
# NOT: url_shortener
```

### Staging Won't Start

```bash
# Check logs
npm run dev:staging

# Common issues:
# - Wrong NODE_ENV
# - Missing .env.staging file
# - Database connection failed
# - Port already in use
```

## Additional Resources

- [Railway Environments](https://docs.railway.app/develop/environments)
- [Deployment Guide](./DEPLOYMENT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

## Summary

Staging environment provides:
- ✅ Safe testing ground for changes
- ✅ Integration testing with production-like setup
- ✅ Risk mitigation before production deployment
- ✅ Better development workflow

**Recommended Workflow:**
1. Develop in feature branches
2. Merge to `staging` branch
3. Test thoroughly in staging environment
4. Only then merge to `main` for production

---

**Questions?** Open an issue or check the [Contributing Guide](./CONTRIBUTING.md).
