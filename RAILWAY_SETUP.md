# Railway Production Setup

Your URL Shortener is deployed on Railway!

## 🚀 Live URL
**https://short-url-production-237f.up.railway.app**

## ⚙️ Environment Variables (Set in Railway Dashboard)

### Prerequisites
1. **Add PostgreSQL database** to your Railway project:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will auto-create the database

### Required Variables

Go to your Railway project → Variables tab and set:

```bash
# Database Configuration (map from PostgreSQL service)
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_POOL_MIN=2
DB_POOL_MAX=10

# Application Configuration
NODE_ENV=production
PORT=3000
BASE_URL=https://short-url-production-237f.up.railway.app

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CUSTOM_CODES=true
ENABLE_RATE_LIMITING=true

# Rate Limiting Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Build & Start Commands

In Settings → Deploy, configure:

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

> 📚 **For detailed Railway deployment guide**, see [RAILWAY.md](./RAILWAY.md)

## 🧪 Test Your Deployment

### 1. Health Check
```bash
curl https://short-url-production-237f.up.railway.app/api/health
```

Expected response:
```json
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

### 2. Create a Short URL
```bash
curl -X POST https://short-url-production-237f.up.railway.app/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/kaikezhang/url-shortener"}'
```

Expected response:
```json
{
  "shortCode": "abc1234",
  "originalUrl": "https://github.com/kaikezhang/url-shortener",
  "shortUrl": "https://short-url-production-237f.up.railway.app/abc1234",
  "createdAt": "2025-10-05T..."
}
```

### 3. Test Redirect
```bash
# Replace abc1234 with your actual short code
curl -L https://short-url-production-237f.up.railway.app/abc1234
```

### 4. Create Custom Short URL
```bash
curl -X POST https://short-url-production-237f.up.railway.app/api/shorten \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "customCode": "gh"}'
```

### 5. Get Analytics
```bash
# Replace abc1234 with your actual short code
curl https://short-url-production-237f.up.railway.app/api/analytics/abc1234
```

### 6. Delete Short URL
```bash
# Replace abc1234 with your actual short code
curl -X DELETE https://short-url-production-237f.up.railway.app/api/urls/abc1234
```

## 📊 Monitoring

### Railway Dashboard
- **Deployments**: View build logs and deployment history
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs

### View Logs
```bash
# If using Railway CLI
railway logs
```

## 🔄 Auto-Deploy Setup

Railway is configured to auto-deploy when you push to `main`:

1. Make changes locally
2. Commit and push to GitHub
3. Railway automatically builds and deploys
4. Check deployment status in Railway dashboard

## 🌐 Custom Domain (Optional)

### Add Your Own Domain

1. **In Railway Dashboard:**
   - Go to Settings → Domains
   - Click "Add Domain"
   - Enter your domain (e.g., `short.yourdomain.com`)

2. **Update DNS:**
   - Add CNAME record:
     ```
     short.yourdomain.com → short-url-production-237f.up.railway.app
     ```

3. **Update Environment Variable:**
   ```bash
   BASE_URL=https://short.yourdomain.com
   ```

4. **Redeploy** (automatic after variable change)

## 🔒 Security Checklist

- [x] HTTPS enabled (automatic with Railway)
- [x] Environment variables set
- [x] Rate limiting enabled
- [ ] Add authentication for admin endpoints (future)
- [ ] Consider adding Helmet.js for security headers
- [ ] Set up monitoring/alerting

## 📈 Scaling Considerations

### Current Setup
- **Storage**: PostgreSQL database with connection pooling
- **Persistence**: All URLs stored in database
- **Scaling**: Ready for horizontal scaling

### Production Upgrades

#### 1. Add Redis for Caching
```bash
# In Railway Dashboard
# Add Redis plugin for caching frequently accessed URLs
# Reduces database load
```

#### 2. Enable Horizontal Scaling
- Railway will load balance automatically across multiple instances

#### 3. Database Optimization
- Monitor query performance in PostgreSQL metrics
- Add indexes for frequently queried columns
- Consider read replicas for high traffic

## 🐛 Troubleshooting

### Application Not Starting
1. Check Railway logs for errors
2. Verify environment variables are set
3. Check build logs for compilation errors

### 500 Internal Server Error
1. Check application logs in Railway
2. Verify BASE_URL is set correctly
3. Check for missing environment variables

### Short URLs Not Working
1. Verify BASE_URL matches your Railway domain
2. Check if URL was created successfully
3. Review application logs

## 💰 Cost Estimation

**Railway Pricing:**
- Free tier: $5 credit/month
- After free tier: ~$5-10/month for basic usage
- Scales with usage (CPU, Memory, Network)

**Cost Tips:**
- Monitor usage in Railway dashboard
- Set up spending limits
- Consider upgrading to hobby plan for production apps

## 🔗 Useful Links

- **Live App**: https://short-url-production-237f.up.railway.app
- **GitHub Repo**: https://github.com/kaikezhang/url-shortener
- **Railway Dashboard**: https://railway.app/dashboard
- **API Documentation**: See [API.md](./API.md)

## 📝 Next Steps

1. **Test all endpoints** using the commands above
2. **Verify database connection** is working (check Railway logs)
3. **Enable feature flags** in Railway variables
4. **Add custom domain** (optional)
5. **Set up monitoring** (Sentry, LogDNA, etc.)
6. **Add Redis** for caching (optional performance optimization)
7. **Configure database backups** in Railway PostgreSQL settings
8. **Set up CI/CD** with GitHub Actions (optional)

## 🆘 Getting Help

- Railway Docs: https://docs.railway.app
- GitHub Issues: https://github.com/kaikezhang/url-shortener/issues
- Railway Discord: https://discord.gg/railway

---

**Your URL Shortener is now live! 🎉**

Test it with:
```bash
curl https://short-url-production-237f.up.railway.app/api/health
```
