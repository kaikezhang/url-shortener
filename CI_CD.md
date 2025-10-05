# CI/CD Pipeline Documentation

Comprehensive guide to the automated CI/CD pipeline for the URL Shortener service.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
- [Branch Strategy](#branch-strategy)
- [Automated Testing](#automated-testing)
- [Deployment Process](#deployment-process)
- [Troubleshooting](#troubleshooting)

---

## Overview

The URL Shortener uses GitHub Actions for automated CI/CD with three main workflows:

1. **CI Workflow** - Continuous Integration (testing, building, security)
2. **Staging Deployment** - Automated deployment to staging environment
3. **Production Deployment** - Automated deployment to production

### Benefits

✅ **Automated Testing** - Every PR and push is automatically tested
✅ **Security Scanning** - Automatic vulnerability checks
✅ **Build Verification** - Ensures code compiles before deployment
✅ **Deployment Automation** - Push to deploy to staging/production
✅ **Smoke Tests** - Automated health checks after deployment

---

## Workflows

### 1. CI Workflow

**File:** `.github/workflows/ci.yml`

**Triggers:**
- Pull requests to `main` or `staging`
- Pushes to `main` or `staging`

**Jobs:**

#### Test & Build Job
- Runs on Ubuntu Latest
- Sets up PostgreSQL database (v16)
- Installs Node.js 18
- Runs tests with coverage
- Builds application
- Uploads coverage reports

**Environment:**
```yaml
services:
  postgres:
    image: postgres:16
    ports: 5432:5432
```

#### Security Audit Job
- Runs `npm audit`
- Checks for vulnerabilities
- Fails on high-severity issues

#### Code Quality Job
- Type checks with TypeScript
- Code formatting checks (Prettier)

**Status Badges:**

Add to README.md:
```markdown
![CI](https://github.com/kaikezhang/url-shortener/workflows/CI/badge.svg)
```

---

### 2. Staging Deployment

**File:** `.github/workflows/staging-deploy.yml`

**Triggers:**
- Push to `staging` branch

**Environment:**
- Name: `staging`
- URL: https://url-shortener-production-ce62.up.railway.app

**Steps:**
1. Checkout code
2. Install dependencies
3. Run tests
4. Build application
5. Wait for Railway deployment (60s)
6. Run smoke tests
7. Report success/failure

**Smoke Tests:**
- Health endpoint check
- API info endpoint check

**Example Output:**
```
🚀 Deploying to staging...
⏳ Waiting for Railway deployment...
🧪 Running smoke tests...
✅ Staging deployment successful!
```

---

### 3. Production Deployment

**File:** `.github/workflows/production-deploy.yml`

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Environment:**
- Name: `production`
- URL: https://short-url-production-237f.up.railway.app

**Steps:**
1. Checkout code
2. Install dependencies
3. Run tests
4. Build and verify
5. Wait for Railway deployment (90s)
6. Run production smoke tests
7. Verify health status
8. Report success/failure

**Production Smoke Tests:**
- Health endpoint check (with JSON validation)
- Status verification (must be "healthy")

**Manual Deployment:**
```bash
# Via GitHub UI
Actions → Deploy to Production → Run workflow

# Provide optional reason
Reason: "Hotfix for bug #123"
```

---

## Branch Strategy

### Git Flow

```
feature/* → staging → main
    ↓          ↓        ↓
   dev      staging   production
```

### Branch Details

| Branch | Purpose | Deploys To | Auto-Deploy |
|--------|---------|------------|-------------|
| `feature/*` | Feature development | - | No |
| `staging` | Integration testing | Staging | ✅ Yes |
| `main` | Production | Production | ✅ Yes |

### Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Develop & Test Locally**
   ```bash
   npm test
   npm run build
   ```

3. **Create PR to Staging**
   ```bash
   git push origin feature/new-feature
   # Create PR: feature/new-feature → staging
   ```

4. **CI Runs Automatically**
   - Tests run
   - Build verified
   - Security scan

5. **Merge to Staging**
   - PR approved and merged
   - Auto-deploys to staging
   - Smoke tests run

6. **Test in Staging**
   ```bash
   ./test-staging.sh
   ```

7. **Promote to Production**
   ```bash
   # Create PR: staging → main
   # After approval, merge
   # Auto-deploys to production
   ```

---

## Automated Testing

### Test Matrix

| Test Type | When | Environment | Coverage |
|-----------|------|-------------|----------|
| **Unit Tests** | Every PR/push | CI | 80%+ |
| **Integration Tests** | Every PR/push | CI + PostgreSQL | All endpoints |
| **Build Tests** | Every PR/push | CI | Build success |
| **Security Audit** | Every PR/push | CI | npm audit |
| **Smoke Tests** | After deployment | Staging/Prod | Health checks |

### Running Tests Locally

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test
npm test -- app.test.ts
```

### CI Test Configuration

**Database Setup:**
- PostgreSQL 16 in Docker container
- Test database: `url_shortener_test`
- Runs health checks before tests

**Test Environment:**
```env
NODE_ENV=test
DB_HOST=localhost
DB_PORT=5432
DB_NAME=url_shortener_test
DB_USER=postgres
DB_PASSWORD=postgres
ENABLE_ANALYTICS=true
ENABLE_CUSTOM_CODES=true
ENABLE_RATE_LIMITING=false
```

---

## Deployment Process

### Staging Deployment

**Automatic Trigger:**
```bash
git push origin staging
```

**Process:**
1. GitHub Actions starts CI workflow
2. Tests run and must pass
3. Build completes successfully
4. Railway detects push to staging branch
5. Railway builds and deploys
6. GitHub Actions waits 60 seconds
7. Smoke tests run against staging URL
8. Success/failure reported

**Timeline:** ~3-5 minutes

**Monitoring:**
```bash
# Watch GitHub Actions
https://github.com/kaikezhang/url-shortener/actions

# Watch Railway deployment
https://railway.app/dashboard
```

---

### Production Deployment

**Automatic Trigger:**
```bash
git push origin main
# or merge PR to main
```

**Manual Trigger:**
```bash
# Via GitHub UI
Actions → Deploy to Production → Run workflow

# Provide deployment reason
Reason: "Promoting staging v1.2.0"
```

**Process:**
1. GitHub Actions starts CI workflow
2. Tests run and must pass
3. Build verified
4. Railway detects push to main
5. Railway builds and deploys
6. GitHub Actions waits 90 seconds
7. Production smoke tests run
8. Health status verified
9. Success/failure reported

**Timeline:** ~4-6 minutes

**Post-Deployment:**
- Monitor Railway logs
- Check application metrics
- Verify database migrations
- Test key functionality

---

## Monitoring CI/CD

### GitHub Actions Dashboard

**View all workflows:**
```
https://github.com/kaikezhang/url-shortener/actions
```

**Status Checks:**
- ✅ Green check - All passed
- ❌ Red X - Failed
- 🟡 Yellow dot - In progress

### Workflow Logs

**Access logs:**
1. Go to Actions tab
2. Click workflow run
3. Click job name
4. Expand steps to see details

**Common Log Sections:**
- Test results
- Build output
- Deployment status
- Smoke test results

---

## Troubleshooting

### CI Workflow Fails

#### Tests Fail

**Problem:** Tests failing in CI but pass locally

**Solution:**
```bash
# Ensure database is configured
# CI uses PostgreSQL 16 in Docker

# Run tests with same config
DB_HOST=localhost npm test

# Check test logs in GitHub Actions
```

#### Build Fails

**Problem:** TypeScript compilation errors

**Solution:**
```bash
# Run build locally
npm run build

# Check for type errors
npx tsc --noEmit

# Fix errors and commit
```

#### Security Audit Fails

**Problem:** Vulnerabilities found

**Solution:**
```bash
# Check vulnerabilities
npm audit

# Update dependencies
npm audit fix

# Or update manually
npm update <package>

# Commit package-lock.json
```

---

### Staging Deployment Fails

#### Railway Deployment Fails

**Problem:** Railway build or deploy fails

**Solution:**
1. Check Railway logs
2. Verify environment variables
3. Check database connection
4. Verify build command in railway.toml

#### Smoke Tests Fail

**Problem:** Health check returns error

**Solution:**
```bash
# Manually test endpoint
curl https://url-shortener-production-ce62.up.railway.app/api/health

# Check Railway logs for errors
# Verify database is accessible
# Check environment variables
```

---

### Production Deployment Fails

#### Health Check Fails

**Problem:** Production health endpoint not responding

**Solution:**
1. Check Railway logs immediately
2. Verify database connection
3. Check environment variables
4. Consider immediate rollback

**Rollback:**
```bash
# In Railway dashboard:
1. Go to Deployments
2. Find previous working deployment
3. Click "Redeploy"
```

#### Database Migration Issues

**Problem:** Migration fails on production

**Solution:**
1. Check Railway logs for migration errors
2. Migrations are idempotent (safe to retry)
3. Restart deployment if needed
4. Verify database credentials

---

## Environment Variables

### Required in GitHub Secrets

Currently, no secrets are required as Railway handles deployment automatically.

**Future additions might include:**
- `RAILWAY_TOKEN` - For programmatic deployments
- `SLACK_WEBHOOK` - For deployment notifications
- `SENTRY_DSN` - For error tracking

### Setting GitHub Secrets

```bash
# Via GitHub UI:
Settings → Secrets and variables → Actions → New repository secret

# Via GitHub CLI:
gh secret set SECRET_NAME
```

---

## Best Practices

### 1. Always Test Before Merging

```bash
# Before creating PR
npm test
npm run build
```

### 2. Use Feature Branches

```bash
# Good
feature/add-analytics
feature/fix-auth-bug

# Avoid
my-changes
test
```

### 3. Keep PRs Small

- One feature per PR
- Easier to review
- Faster to merge
- Easier to rollback

### 4. Test in Staging First

- Never merge directly to main
- Always test in staging
- Run comprehensive tests
- Verify all features work

### 5. Monitor Deployments

- Watch GitHub Actions
- Check Railway logs
- Verify health endpoints
- Test critical paths

---

## CI/CD Metrics

### Success Rates

**Target Metrics:**
- CI Success Rate: >95%
- Staging Deploy Success: >98%
- Production Deploy Success: >99%
- Average Build Time: <3 minutes
- Average Deploy Time: <5 minutes

### Monitoring

Track these metrics:
- Build success/failure rate
- Test pass/fail rate
- Deployment frequency
- Time to deploy
- Rollback frequency

---

## Advanced Configuration

### Adding New Tests

**Edit:** `.github/workflows/ci.yml`

```yaml
- name: Run new test suite
  run: npm run test:integration
```

### Custom Smoke Tests

**Edit:** `.github/workflows/staging-deploy.yml`

```yaml
- name: Extended smoke tests
  run: |
    ./test-staging.sh
    # Add more tests
```

### Slack Notifications

```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Deployment Gates

```yaml
environment:
  name: production
  # Requires manual approval
  required_reviewers:
    - username
```

---

## Workflow Diagram

```
┌─────────────┐
│   PR Created │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  CI Runs    │
│  - Tests    │
│  - Build    │
│  - Security │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Merge to    │
│  Staging    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Auto-Deploy │
│  to Staging │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Smoke Tests │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Manual Test │
│  in Staging │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Merge to    │
│    Main     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Auto-Deploy │
│ to Production│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Success!   │
└─────────────┘
```

---

## Summary

### What We Have

✅ **Automated CI** - Tests on every PR/push
✅ **Staging Deployment** - Auto-deploy to staging
✅ **Production Deployment** - Auto-deploy to production
✅ **Smoke Tests** - Automated health checks
✅ **Security Scanning** - Vulnerability detection
✅ **Build Verification** - Ensures code compiles

### Deployment Flow

```
Code Push → Tests → Build → Deploy → Verify → Success
```

### Time to Production

- **Code to Staging**: ~3-5 minutes
- **Staging to Production**: ~4-6 minutes
- **Total**: ~10-15 minutes for full deployment

---

## Next Steps

- [x] Set up CI/CD pipeline ✅
- [ ] Add Slack/Discord notifications
- [ ] Set up error tracking (Sentry)
- [ ] Add performance monitoring
- [ ] Configure deployment gates
- [ ] Add automated database backups
- [ ] Set up log aggregation

---

## Support

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Railway Docs**: https://docs.railway.app
- **Project Issues**: https://github.com/kaikezhang/url-shortener/issues

---

**Last Updated:** 2025-10-05
**Version:** 1.0.0
