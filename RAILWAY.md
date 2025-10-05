# Railway Deployment Guide

Complete guide for deploying the URL Shortener service to Railway with PostgreSQL.

## 🚀 Quick Setup

### Step 1: Create Railway Project

1. Go to [Railway](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `url-shortener` repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically creates the database and sets environment variables

### Step 3: Configure Environment Variables

Click on your web service → **"Variables"** tab → Add these variables:

#### Required Database Variables (map from PostgreSQL service):

```env
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_POOL_MIN=2
DB_POOL_MAX=10
```

#### Application Variables:

```env
PORT=3000
NODE_ENV=production
BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}
ENABLE_ANALYTICS=false
ENABLE_CUSTOM_CODES=false
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

> **Note:** `${{RAILWAY_PUBLIC_DOMAIN}}` will auto-resolve to your Railway domain (e.g., `https://your-app.up.railway.app`)

### Step 4: Configure Build & Start Commands

In your service → **Settings** → **Deploy**:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

### Step 5: Deploy

Click **"Deploy"** or push to your main branch. Railway will automatically:
1. Build your application
2. Start the server

## 🔍 Verify Deployment

### Check Deployment Logs

In Railway → **Deployments** → Click latest deployment → **View Logs**

You should see:
```
Database connected successfully
Server listening on port 3000
```

### Test Your API

```bash
# Get your Railway URL from the dashboard
export RAILWAY_URL="https://your-app.up.railway.app"

# Test health endpoint
curl $RAILWAY_URL/api/health

# Create a short URL
curl -X POST $RAILWAY_URL/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Visit the short URL
curl -L $RAILWAY_URL/abc123
```

## 🛠 Configuration Details

### Railway-Specific Settings

Railway automatically provides:
- **Service Variables**: All PostgreSQL connection details
- **Public Domain**: Accessible via `${{RAILWAY_PUBLIC_DOMAIN}}`
- **Private Networking**: Services can communicate internally
- **Auto-deploys**: Every push to main triggers deployment

### Custom Domain (Optional)

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"** or **"Custom Domain"**
3. Update `BASE_URL` environment variable to your custom domain

### Database Connection

Railway PostgreSQL services automatically create these variables:
- `DATABASE_URL` - Full connection string
- `PGHOST` - Database host
- `PGPORT` - Database port (default: 5432)
- `PGDATABASE` - Database name
- `PGUSER` - Database user
- `PGPASSWORD` - Database password

We map these to our app's expected format (`DB_HOST`, `DB_PORT`, etc.)

## 📊 Monitoring

### View Logs

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# View logs
railway logs
```

### Database Metrics

1. Click on PostgreSQL service
2. View **Metrics** tab for:
   - CPU usage
   - Memory usage
   - Connection count
   - Query performance

### Application Metrics

1. Click on web service
2. View **Metrics** tab for:
   - Request count
   - Response times
   - Error rates

## 🔄 Updating After Merging PRs

### Automatic Deployment

Railway auto-deploys when you push to main:

```bash
# Merge your PR on GitHub
# Railway automatically:
# 1. Detects the push
# 2. Builds the new version
# 3. Deploys the app
```

### Manual Deployment

In Railway dashboard:
1. Click **"Deployments"**
2. Click **"Redeploy"** on any previous deployment

Or use Railway CLI:
```bash
railway up
```

## 🔧 Troubleshooting

### Connection Errors

**Error: "Connection refused"**

Check environment variables:
```bash
railway variables
```

Ensure all DB_* variables are set correctly.

**Error: "Too many connections"**

Reduce connection pool:
```env
DB_POOL_MAX=5  # Lower from default 10
```

### Build Failures

**Error: "Module not found"**

Ensure all dependencies are in `package.json`:
```bash
npm install --save <missing-package>
git commit -am "Add missing dependency"
git push
```

### App Crashes on Startup

**Check logs:**
```bash
railway logs --deployment <deployment-id>
```

**Common causes:**
- Missing environment variables
- Database connection failed
- Port binding issues (Railway auto-assigns PORT)

## 🔐 Security Best Practices

### 1. Environment Variables

- ✅ Never commit `.env` files
- ✅ Use Railway's Variables feature
- ✅ Rotate database passwords regularly

### 2. Database Security

- ✅ Railway PostgreSQL is private by default (good!)
- ✅ Only accessible from your Railway services
- ✅ Enable backups in PostgreSQL settings

### 3. Rate Limiting

Enable rate limiting for production:
```env
ENABLE_RATE_LIMITING=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
```

## 💾 Database Backups

### Automatic Backups

Railway automatically backs up PostgreSQL databases.

### Manual Backup

```bash
# Install Railway CLI
railway login
railway link

# Create backup
railway run pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Restore from Backup

```bash
# Restore to Railway database
railway run psql $DATABASE_URL < backup_20251005.sql
```

## 🚨 Rollback Procedures

### Rollback Application

1. Go to **Deployments**
2. Find previous working deployment
3. Click **"Redeploy"**

## 📈 Scaling

### Vertical Scaling (Increase Resources)

1. Go to **Settings** → **Resources**
2. Upgrade plan for more CPU/memory

### Horizontal Scaling (Multiple Instances)

Railway supports horizontal scaling:
1. Go to **Settings** → **Deploy**
2. Set **"Replicas"** to desired count
3. Railway will automatically load balance across instances

## 🔗 Connecting to Database Directly

### Using Railway CLI

```bash
railway connect postgres
```

### Using psql

```bash
# Get connection details
railway variables

# Connect
psql "postgresql://<user>:<password>@<host>:<port>/<database>"
```

### Viewing Database Data

```sql
-- Check urls table
SELECT * FROM urls LIMIT 10;

-- Check table structure
\d urls

-- Count total URLs
SELECT COUNT(*) FROM urls;
```

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app/)
- [PostgreSQL on Railway](https://docs.railway.app/databases/postgresql)
- [Environment Variables](https://docs.railway.app/develop/variables)
- [Custom Domains](https://docs.railway.app/deploy/exposing-your-app)

## ✅ Post-Deployment Checklist

- [ ] PostgreSQL service added and running
- [ ] All environment variables configured
- [ ] Build command set to `npm install && npm run build`
- [ ] Start command set to `npm start`
- [ ] First deployment successful
- [ ] Database connection verified (check logs)
- [ ] Health check endpoint returns 200
- [ ] Can create and retrieve short URLs
- [ ] Custom domain configured (if needed)
- [ ] Monitoring and alerts set up

## 🎯 Next Steps

1. **Set up monitoring**: Connect Railway to monitoring services
2. **Configure alerts**: Get notified of deployment failures
3. **Add custom domain**: Use your own domain name
4. **Enable backups**: Schedule regular database backups
5. **Set up staging**: Create separate Railway project for testing
