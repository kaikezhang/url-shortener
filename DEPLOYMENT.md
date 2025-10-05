# Production Deployment Guide

This guide covers how to deploy the URL Shortener service to production environments.

## Table of Contents

- [Quick Start](#quick-start)
- [Deployment Methods](#deployment-methods)
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

The Docker container will automatically start the application with the configured database.

### Manual Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Build application
npm run build

# 4. Start/restart the application
pm2 restart url-shortener
# or
systemctl restart url-shortener
```

## Deployment Methods

### 1. Docker Deployment (Recommended)

Using Docker provides consistency across environments and simplifies deployment.

**Pros:**
- Consistent environment across dev/staging/production
- Easy rollback by switching container versions
- Works with container orchestration (Docker Swarm, Kubernetes)

**Example:**
```bash
# Build and tag the image
docker build -t url-shortener:latest .

# Run the container
docker run -d \
  --name url-shortener \
  --network=url-shortener-network \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  url-shortener:latest
```

### 2. Manual Deployment with PM2

For traditional server deployments, use PM2 to manage the Node.js process.

**Install PM2:**
```bash
npm install -g pm2
```

**Deploy:**
```bash
# Build the application
npm run build

# Start with PM2
pm2 start dist/index.js --name url-shortener

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

**Update deployment:**
```bash
git pull origin main
npm install
npm run build
pm2 reload url-shortener
```

### 3. Kubernetes Deployment

For large-scale deployments, use Kubernetes for orchestration.

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: url-shortener
spec:
  replicas: 3
  selector:
    matchLabels:
      app: url-shortener
  template:
    metadata:
      labels:
        app: url-shortener
    spec:
      containers:
      - name: url-shortener
        image: your-registry/url-shortener:latest
        ports:
        - containerPort: 3000
        env:
        - name: DB_HOST
          value: "postgres-service"
        - name: DB_NAME
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: database
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Deploy:**
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

## Database Setup

Before deploying the application, ensure your PostgreSQL database is set up:

1. Create the database:
```sql
CREATE DATABASE url_shortener;
```

2. Create the database schema (run once):
```sql
CREATE TABLE IF NOT EXISTS urls (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(20) NOT NULL UNIQUE,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  clicks INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_urls_short_code ON urls(short_code);
CREATE INDEX IF NOT EXISTS idx_urls_created_at ON urls(created_at);
```

3. Configure the application with database credentials via environment variables.

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy Application
        run: |
          ssh ${{ secrets.PROD_SERVER }} << 'EOF'
            cd /app/url-shortener
            git pull origin main
            npm install
            npm run build
            pm2 reload url-shortener
          EOF

      - name: Health Check
        run: |
          sleep 5
          curl -f https://yourapp.com/api/health || exit 1
```

### GitLab CI Example

```yaml
# .gitlab-ci.yml
stages:
  - test
  - deploy

test:
  stage: test
  script:
    - npm ci
    - npm test
  only:
    - main

deploy:
  stage: deploy
  script:
    - ssh $PROD_SERVER "cd /app && git pull && npm install && npm run build && pm2 reload url-shortener"
  only:
    - main
```

## Rollback Procedures

### Rolling Back with Docker

```bash
# List available images
docker images url-shortener

# Stop current container
docker stop url-shortener

# Start previous version
docker run -d \
  --name url-shortener \
  -p 3000:3000 \
  --env-file .env \
  url-shortener:previous-tag
```

### Rolling Back with PM2

```bash
# Checkout previous version
git log --oneline -n 10
git checkout <previous-commit>

# Rebuild and restart
npm install
npm run build
pm2 restart url-shortener
```

### Rolling Back in Kubernetes

```bash
# View deployment history
kubectl rollout history deployment/url-shortener

# Rollback to previous version
kubectl rollout undo deployment/url-shortener

# Rollback to specific revision
kubectl rollout undo deployment/url-shortener --to-revision=2
```

## Best Practices

### 1. **Test on Staging First**

Always deploy to a staging environment before production:

```bash
# Deploy to staging
ssh staging-server
git pull origin main
npm install
npm run build
pm2 reload url-shortener

# Verify functionality
curl https://staging.yourapp.com/api/health

# Then deploy to production
```

### 2. **Backup Database Before Major Changes**

```bash
# Use the automated backup script
./scripts/backup/backup.sh

# Or manually create backup
pg_dump -U postgres url_shortener > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore if needed
./scripts/backup/restore.sh latest
# Or manually restore
psql -U postgres url_shortener < backup_20251005_120000.sql
```

For complete backup documentation, see [BACKUP.md](./BACKUP.md).

### 3. **Monitor Deployment**

```bash
# Monitor application logs
docker compose logs -f url-shortener

# Or with PM2
pm2 logs url-shortener

# Monitor system metrics
pm2 monit
```

### 4. **Use Environment Variables**

Never hardcode credentials in your code. Use environment variables:

```env
# Production
NODE_ENV=production
DB_HOST=prod-db.example.com
DB_NAME=url_shortener
DB_USER=prod_user
DB_PASSWORD=<strong-password>
DB_POOL_MIN=5
DB_POOL_MAX=20

# Application
PORT=3000
BASE_URL=https://short.example.com
```

### 5. **Enable Health Checks**

Configure load balancers and orchestration tools to use the health endpoint:

```bash
# Manual health check
curl https://yourapp.com/api/health

# Example response:
# {
#   "status": "healthy",
#   "timestamp": "2025-10-05T12:00:00.000Z",
#   "urlCount": 1234,
#   "features": {...}
# }
```

### 6. **Set Up Logging**

Configure structured logging for production:

- Use log aggregation tools (ELK stack, CloudWatch, Datadog)
- Set appropriate log levels (ERROR, WARN, INFO)
- Include request IDs for tracing
- Monitor error rates and set up alerts

### 7. **Configure Connection Pooling**

Optimize database connections for your workload:

```env
# For high-traffic applications
DB_POOL_MAX=20

# For low-traffic applications
DB_POOL_MAX=5

# Monitor connection usage
# SELECT count(*) FROM pg_stat_activity WHERE datname = 'url_shortener';
```

### 8. **Use HTTPS in Production**

Always use HTTPS for production deployments:

- Use SSL/TLS certificates (Let's Encrypt for free certificates)
- Configure your reverse proxy (nginx, Apache) to handle HTTPS
- Redirect HTTP to HTTPS
- Enable HSTS (HTTP Strict Transport Security)

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
BASE_URL=https://short.example.com
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
BASE_URL=https://staging.example.com
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
BASE_URL=http://localhost:3000
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs url-shortener --lines 100

# Or with Docker
docker logs url-shortener

# Common issues:
# - Database connection failed (check DB_HOST, credentials)
# - Port already in use (check PORT configuration)
# - Missing environment variables
```

### Database Connection Issues

```bash
# Test database connectivity
psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Check connection pool
# Look for "pool connect" messages in logs

# Verify network connectivity
telnet $DB_HOST 5432
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Or with Docker
docker stats url-shortener

# Solutions:
# - Reduce DB_POOL_MAX
# - Increase container/server memory limits
# - Check for memory leaks in application code
```

## Security Considerations

1. **Database Security:**
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access by IP
   - Use read-only users when possible

2. **Application Security:**
   - Keep dependencies updated
   - Run security audits: `npm audit`
   - Use environment variables for secrets
   - Enable CORS only for trusted origins
   - Implement rate limiting in production

3. **Infrastructure Security:**
   - Use firewalls to restrict access
   - Keep OS and software updated
   - Use SSH keys instead of passwords
   - Enable intrusion detection
   - Regular security audits

## Next Steps

- [x] Set up staging environment - ✅ Complete (See [STAGING.md](./STAGING.md))
- [x] Configure CI/CD pipeline - ✅ Complete (See [CI_CD.md](./CI_CD.md))
- [x] Set up database backup schedule - ✅ Complete (See [BACKUP.md](./BACKUP.md))
- [x] Configure monitoring and alerting - ✅ Complete (See [MONITORING.md](./MONITORING.md))
- [ ] Document rollback procedures for your team
- [ ] Test disaster recovery procedures
- [ ] Set up log aggregation
- [ ] Configure auto-scaling (if using cloud platforms)
