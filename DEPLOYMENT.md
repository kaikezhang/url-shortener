# Deployment Guide

Complete guide for deploying the URL Shortener Service to various cloud platforms.

## Table of Contents
- [Quick Deploy (Easiest Options)](#quick-deploy-easiest-options)
- [Docker-Based Deployments](#docker-based-deployments)
- [Traditional Cloud Platforms](#traditional-cloud-platforms)
- [Production Considerations](#production-considerations)

---

## Quick Deploy (Easiest Options)

### 1. Railway (Recommended for Beginners) ⭐

**Time to deploy:** ~5 minutes

**Steps:**

1. **Visit [Railway.app](https://railway.app)** and sign in with GitHub

2. **Create new project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `url-shortener`

3. **Configure environment variables:**
   ```
   BASE_URL=https://your-app.railway.app
   ENABLE_ANALYTICS=true
   ENABLE_CUSTOM_CODES=true
   ENABLE_RATE_LIMITING=true
   ```

4. **Deploy!** Railway auto-builds and deploys

**CLI Method (Alternative):**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables
railway variables set BASE_URL=https://your-app.railway.app
railway variables set ENABLE_ANALYTICS=true
```

**Cost:** Free tier includes $5 credit/month

**Pros:**
- ✅ Auto-deploy on git push
- ✅ Free SSL certificate
- ✅ Easy environment variable management
- ✅ Built-in metrics

---

### 2. Render

**Time to deploy:** ~5 minutes

**Steps:**

1. **Visit [render.com](https://render.com)** and sign in

2. **Create Web Service:**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select `url-shortener`

3. **Configure:**
   ```
   Name: url-shortener
   Environment: Node
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

4. **Add Environment Variables:**
   ```
   BASE_URL → https://url-shortener.onrender.com
   ENABLE_ANALYTICS → true
   ENABLE_CUSTOM_CODES → true
   ```

5. **Create Web Service**

**Cost:** Free tier available (spins down after inactivity)

**Pros:**
- ✅ Free tier with 750 hours/month
- ✅ Auto SSL
- ✅ PostgreSQL add-on available
- ✅ Custom domains

---

### 3. Fly.io (Docker-based)

**Time to deploy:** ~10 minutes

**Steps:**

1. **Install Fly CLI:**
   ```bash
   # macOS
   brew install flyctl

   # Linux/WSL
   curl -L https://fly.io/install.sh | sh

   # Windows
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Launch app:**
   ```bash
   fly launch
   ```

   Answer prompts:
   - App name: `url-shortener` (or custom)
   - Region: Choose closest to your users
   - PostgreSQL: No (we use in-memory storage for MVP)
   - Redis: No (not needed for MVP)
   - Deploy: Yes

4. **Set secrets:**
   ```bash
   fly secrets set BASE_URL=https://url-shortener.fly.dev
   fly secrets set ENABLE_ANALYTICS=true
   fly secrets set ENABLE_CUSTOM_CODES=true
   ```

5. **Deploy updates:**
   ```bash
   fly deploy
   ```

**Cost:** Free allowance includes 3 VMs, 160GB bandwidth/month

**Pros:**
- ✅ Uses your Dockerfile
- ✅ Global CDN
- ✅ Fast deployments
- ✅ Easy scaling

---

### 4. Vercel (Serverless)

**Note:** Requires slight modification for serverless

**Steps:**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel dashboard**

**Note:** You'll need to add a `vercel.json` configuration file for serverless deployment.

---

## Docker-Based Deployments

### 5. Google Cloud Run

**Time to deploy:** ~15 minutes

**Steps:**

1. **Install Google Cloud SDK:**
   ```bash
   # macOS
   brew install --cask google-cloud-sdk

   # Or download from cloud.google.com
   ```

2. **Login and setup:**
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

3. **Build and push Docker image:**
   ```bash
   # Build
   docker build -t gcr.io/YOUR_PROJECT_ID/url-shortener .

   # Push to Google Container Registry
   docker push gcr.io/YOUR_PROJECT_ID/url-shortener
   ```

4. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy url-shortener \
     --image gcr.io/YOUR_PROJECT_ID/url-shortener \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars BASE_URL=https://YOUR-SERVICE.run.app,ENABLE_ANALYTICS=true
   ```

**Cost:** Free tier includes 2 million requests/month

**Pros:**
- ✅ Serverless (pay per request)
- ✅ Auto-scaling
- ✅ Free SSL
- ✅ Global CDN

---

### 6. AWS App Runner

**Time to deploy:** ~15 minutes

**Steps:**

1. **Push Docker image to ECR:**
   ```bash
   # Authenticate
   aws ecr get-login-password --region us-east-1 | \
     docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

   # Create repository
   aws ecr create-repository --repository-name url-shortener

   # Build and push
   docker build -t url-shortener .
   docker tag url-shortener:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/url-shortener:latest
   docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/url-shortener:latest
   ```

2. **Create App Runner service via AWS Console:**
   - Go to App Runner
   - Create service
   - Source: Container registry → ECR
   - Select your image
   - Configure environment variables
   - Deploy

**Alternative - GitHub source:**
```bash
aws apprunner create-service \
  --service-name url-shortener \
  --source-configuration file://apprunner-source.json
```

---

### 7. Azure Container Instances

**Steps:**

1. **Login to Azure:**
   ```bash
   az login
   ```

2. **Create resource group:**
   ```bash
   az group create --name url-shortener-rg --location eastus
   ```

3. **Create container registry:**
   ```bash
   az acr create --resource-group url-shortener-rg \
     --name urlshorteneracr --sku Basic
   ```

4. **Build and push:**
   ```bash
   az acr build --registry urlshorteneracr \
     --image url-shortener:latest .
   ```

5. **Deploy:**
   ```bash
   az container create \
     --resource-group url-shortener-rg \
     --name url-shortener \
     --image urlshorteneracr.azurecr.io/url-shortener:latest \
     --dns-name-label url-shortener-unique \
     --ports 3000 \
     --environment-variables BASE_URL=http://url-shortener-unique.eastus.azurecontainer.io:3000
   ```

---

## Traditional Cloud Platforms

### 8. DigitalOcean App Platform

**Steps:**

1. **Visit [cloud.digitalocean.com](https://cloud.digitalocean.com)**

2. **Create App:**
   - Click "Create" → "Apps"
   - Connect GitHub repo
   - Select `url-shortener`
   - Choose plan ($5/month basic)

3. **Configure:**
   - Detected as Node.js app
   - Build: `npm install && npm run build`
   - Run: `npm start`

4. **Add environment variables**

5. **Deploy**

**Cost:** Starts at $5/month

---

### 9. AWS EC2 (Traditional VPS)

**Steps:**

1. **Launch EC2 instance:**
   - Amazon Linux 2 or Ubuntu
   - t2.micro (free tier eligible)
   - Configure security group (allow port 3000 or 80)

2. **SSH into instance:**
   ```bash
   ssh -i your-key.pem ec2-user@your-instance-ip
   ```

3. **Install Node.js:**
   ```bash
   # Amazon Linux 2
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 18

   # Install git
   sudo yum install git -y
   ```

4. **Clone and setup:**
   ```bash
   git clone https://github.com/kaikezhang/url-shortener.git
   cd url-shortener
   npm install
   npm run build
   ```

5. **Create .env file:**
   ```bash
   cat > .env << EOF
   PORT=3000
   BASE_URL=http://your-instance-ip:3000
   ENABLE_ANALYTICS=true
   EOF
   ```

6. **Run with PM2:**
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name url-shortener
   pm2 startup
   pm2 save
   ```

7. **Setup nginx (optional):**
   ```bash
   sudo yum install nginx -y
   ```

---

### 10. Docker on VPS (DigitalOcean Droplet, Linode, etc.)

**Steps:**

1. **Create droplet/VPS with Docker pre-installed**

2. **SSH and clone repo:**
   ```bash
   git clone https://github.com/kaikezhang/url-shortener.git
   cd url-shortener
   ```

3. **Create .env:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

4. **Deploy with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

5. **Setup reverse proxy (nginx):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

6. **Get SSL with Let's Encrypt:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Production Considerations

### Before Deploying to Production:

#### 1. **Replace In-Memory Storage**

Current MVP uses a Map for storage. For production:

**Option A: Redis**
```bash
# Install Redis add-on on your platform
# Update code to use Redis instead of Map
```

**Option B: PostgreSQL**
```bash
# Add PostgreSQL database
# Create URLs table
# Update UrlShortenerService to use database
```

#### 2. **Environment Variables Checklist**

```env
# Required
NODE_ENV=production
PORT=3000
BASE_URL=https://your-domain.com

# Optional Features
ENABLE_ANALYTICS=true
ENABLE_CUSTOM_CODES=true
ENABLE_RATE_LIMITING=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Future: Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

#### 3. **Security Enhancements**

Add helmet.js for security headers:
```bash
npm install helmet
```

#### 4. **Monitoring**

Add application monitoring:
- **Sentry** for error tracking
- **New Relic** or **DataDog** for APM
- **LogDNA** or **Papertrail** for logging

#### 5. **Custom Domain**

Most platforms support custom domains:
```bash
# Example for Fly.io
fly certs create your-domain.com

# Example for Railway
# Add custom domain in dashboard

# Example for Render
# Add custom domain in dashboard
```

#### 6. **CI/CD Setup**

Add GitHub Actions for automated testing and deployment:

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm run build
      # Add deployment steps for your platform
```

---

## Comparison Table

| Platform | Free Tier | Ease of Use | Docker Support | Auto-Deploy | Best For |
|----------|-----------|-------------|----------------|-------------|----------|
| **Railway** | ✅ $5/mo | ⭐⭐⭐⭐⭐ | ✅ | ✅ | Beginners |
| **Render** | ✅ 750h/mo | ⭐⭐⭐⭐⭐ | ✅ | ✅ | Simple apps |
| **Fly.io** | ✅ Limited | ⭐⭐⭐⭐ | ✅ | ✅ | Docker apps |
| **Google Cloud Run** | ✅ 2M req/mo | ⭐⭐⭐ | ✅ | ❌ | Serverless |
| **AWS App Runner** | ❌ | ⭐⭐⭐ | ✅ | ✅ | AWS users |
| **DigitalOcean** | ❌ $5/mo | ⭐⭐⭐⭐ | ✅ | ✅ | Simple & cheap |
| **AWS EC2** | ✅ t2.micro | ⭐⭐ | ✅ | ❌ | Full control |
| **Azure** | ✅ Limited | ⭐⭐ | ✅ | ❌ | Azure users |

---

## Recommendation by Use Case

- **Just want it online fast?** → Railway or Render
- **Using Docker already?** → Fly.io or Google Cloud Run
- **Need free tier?** → Render, Railway, or Google Cloud Run
- **Heavy AWS user?** → AWS App Runner or ECS
- **Want full control?** → DigitalOcean Droplet or AWS EC2
- **Building a startup?** → Fly.io or Railway (easy to scale)
- **Enterprise?** → AWS ECS/EKS or Google Cloud Run

---

## Getting Help

- Railway: [docs.railway.app](https://docs.railway.app)
- Render: [render.com/docs](https://render.com/docs)
- Fly.io: [fly.io/docs](https://fly.io/docs)
- AWS: [docs.aws.amazon.com](https://docs.aws.amazon.com)
- GCP: [cloud.google.com/docs](https://cloud.google.com/docs)

---

## Next Steps After Deployment

1. ✅ Test all endpoints
2. ✅ Set up monitoring
3. ✅ Configure custom domain
4. ✅ Enable SSL/HTTPS
5. ✅ Set up CI/CD
6. ✅ Add database for persistence
7. ✅ Configure backups
8. ✅ Set up error tracking
9. ✅ Add rate limiting in production
10. ✅ Monitor costs and usage

---

For more help, see the main [README.md](./README.md) or open an issue on GitHub.
