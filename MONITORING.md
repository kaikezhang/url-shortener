# Monitoring and Alerting Guide

This guide covers simple, practical monitoring and alerting solutions for the URL Shortener service.

## Table of Contents

- [Quick Start](#quick-start)
- [Health Monitoring](#health-monitoring)
- [Application Metrics](#application-metrics)
- [Log Monitoring](#log-monitoring)
- [Uptime Monitoring](#uptime-monitoring)
- [Alerting Setup](#alerting-setup)
- [Dashboard Examples](#dashboard-examples)

## Quick Start

The easiest way to get started with monitoring:

1. **Use the built-in health endpoint**: `/api/health`
2. **Set up uptime monitoring** with a free service (5 minutes)
3. **Monitor application logs** with PM2 or Docker logs
4. **Add basic metrics** to track performance

## Health Monitoring

### Built-in Health Endpoint

The application provides a health check endpoint at `/api/health`:

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-05T12:00:00.000Z",
  "uptime": 86400,
  "database": "connected",
  "urlCount": 1234
}
```

### PM2 Monitoring (Easiest for Node.js)

If you're using PM2, you get built-in monitoring. **For complete PM2 production setup, see [PM2_SETUP.md](./PM2_SETUP.md)**.

Quick commands:

```bash
# Real-time monitoring dashboard
npm run pm2:monit

# View metrics
npm run pm2:status

# View logs
npm run pm2:logs
```

**Key metrics provided by PM2:**
- CPU usage
- Memory usage
- Restart count
- Uptime
- Process status

**Production setup includes:**
- Cluster mode with load balancing
- Auto-restart on crashes
- Memory limit management
- Log rotation
- Alerts and notifications

### Docker Health Checks

Add health check to your `docker-compose.yml`:

```yaml
services:
  url-shortener:
    image: url-shortener:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Check health status:
```bash
docker ps  # Shows health status
docker inspect url-shortener | grep -i health
```

## Application Metrics

### Simple Metrics Endpoint

The application provides a `/api/metrics` endpoint for basic metrics:

```bash
curl http://localhost:3000/api/metrics
```

**Response:**
```json
{
  "urls": {
    "total": 1234,
    "created_today": 45,
    "created_this_week": 312
  },
  "clicks": {
    "total": 5678,
    "today": 234,
    "this_week": 1567
  },
  "performance": {
    "uptime_seconds": 86400,
    "memory_usage_mb": 145.2,
    "cpu_usage_percent": 12.5
  },
  "database": {
    "status": "connected",
    "pool_size": 10,
    "active_connections": 3
  }
}
```

### Track Key Metrics

Monitor these essential metrics:

1. **URL Creation Rate** - URLs created per hour/day
2. **Click/Redirect Rate** - Redirects per hour/day
3. **Error Rate** - 4xx and 5xx errors
4. **Response Time** - Average API response time
5. **Database Performance** - Query execution time
6. **Memory Usage** - Application memory consumption
7. **CPU Usage** - Server CPU utilization

## Log Monitoring

### PM2 Logs

```bash
# View real-time logs
pm2 logs url-shortener

# View last 100 lines
pm2 logs url-shortener --lines 100

# View only errors
pm2 logs url-shortener --err

# Export logs
pm2 logs url-shortener --out > app.log
```

### Docker Logs

```bash
# View real-time logs
docker compose logs -f url-shortener

# View last 100 lines
docker compose logs --tail 100 url-shortener

# View logs from last hour
docker compose logs --since 1h url-shortener

# Filter for errors
docker compose logs url-shortener | grep -i error
```

### Log Patterns to Monitor

Watch for these patterns in your logs:

```bash
# Database connection errors
grep "ECONNREFUSED\|database error" logs/

# High error rates
grep "ERROR\|FATAL" logs/ | wc -l

# Slow queries (if logging enabled)
grep "slow query" logs/

# Failed URL shortening
grep "failed to create short url" logs/
```

## Uptime Monitoring

### Option 1: UptimeRobot (Free & Easy)

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Create free account (50 monitors, 5-minute checks)
3. Add new monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://yourapp.com/api/health`
   - **Interval**: 5 minutes
   - **Alert contacts**: Email, SMS, Slack

**Benefits:**
- No setup required
- Free tier available
- Email/SMS alerts
- Status page
- Slack/Discord integration

### Option 2: Healthchecks.io (Developer-Friendly)

```bash
# Install healthchecks CLI
npm install -g healthchecks.io

# Create a cron job to ping healthchecks
*/5 * * * * curl -fsS --retry 3 https://hc-ping.com/YOUR-UUID-HERE > /dev/null
```

### Option 3: Simple Bash Script

Create `scripts/monitoring/health-check.sh`:

```bash
#!/bin/bash

URL="http://localhost:3000/api/health"
SLACK_WEBHOOK="your-slack-webhook-url"

response=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

if [ "$response" != "200" ]; then
    # Send alert
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"⚠️ URL Shortener is DOWN! Status: $response\"}" \
        "$SLACK_WEBHOOK"

    echo "ALERT: Service is down (HTTP $response)"
    exit 1
fi

echo "OK: Service is healthy"
```

Run with cron:
```bash
# Check every 5 minutes
*/5 * * * * /path/to/health-check.sh >> /var/log/health-check.log 2>&1
```

## Alerting Setup

### Slack Alerts (Easiest)

1. Create Slack webhook:
   - Go to Slack → Apps → Incoming Webhooks
   - Add to your workspace
   - Copy webhook URL

2. Use the webhook in your monitoring scripts:

```bash
#!/bin/bash
WEBHOOK_URL="your-webhook-url"

# Example: Alert on high error rate
error_count=$(grep ERROR /var/log/app.log | wc -l)

if [ $error_count -gt 100 ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 High error rate detected: $error_count errors\"}" \
        "$WEBHOOK_URL"
fi
```

### Email Alerts

Using `mailx` or `sendmail`:

```bash
#!/bin/bash

check_and_alert() {
    if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "URL Shortener service is down!" | \
            mail -s "ALERT: Service Down" admin@example.com
    fi
}

check_and_alert
```

### PM2 Alerts

PM2 can notify you of crashes and restarts:

```bash
# Install PM2 module for notifications
pm2 install pm2-auto-pull
pm2 install pm2-slack

# Configure Slack notifications
pm2 set pm2-slack:slack_url https://hooks.slack.com/services/YOUR/WEBHOOK/URL
pm2 set pm2-slack:servername "Production Server"

# PM2 will now send notifications on:
# - Application crashes
# - Restarts
# - High memory usage
```

## Dashboard Examples

### Option 1: PM2 Web Dashboard

```bash
# Install PM2 web interface
pm2 install pm2-server-monit

# Access at http://localhost:9615
```

### Option 2: Simple HTML Dashboard

Create `public/dashboard.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>URL Shortener Monitoring</title>
    <script>
        async function updateMetrics() {
            const response = await fetch('/api/metrics');
            const data = await response.json();

            document.getElementById('total-urls').textContent = data.urls.total;
            document.getElementById('total-clicks').textContent = data.clicks.total;
            document.getElementById('memory').textContent = data.performance.memory_usage_mb.toFixed(2);
            document.getElementById('cpu').textContent = data.performance.cpu_usage_percent.toFixed(1);
        }

        setInterval(updateMetrics, 5000);
        updateMetrics();
    </script>
</head>
<body>
    <h1>URL Shortener Metrics</h1>
    <div>Total URLs: <span id="total-urls">-</span></div>
    <div>Total Clicks: <span id="total-clicks">-</span></div>
    <div>Memory: <span id="memory">-</span> MB</div>
    <div>CPU: <span id="cpu">-</span>%</div>
</body>
</html>
```

### Option 3: Grafana + Prometheus (Advanced)

For a more comprehensive solution, see the [Advanced Monitoring](#advanced-monitoring) section below.

## Quick Monitoring Checklist

- [ ] Set up UptimeRobot for uptime monitoring
- [ ] Configure PM2 monitoring (if using PM2)
- [ ] Add health check script to cron
- [ ] Set up Slack webhook for alerts
- [ ] Create simple monitoring dashboard
- [ ] Configure log rotation
- [ ] Set up database monitoring
- [ ] Test alert notifications

## Monitoring Scenarios

### Scenario 1: Service Goes Down

**Detection:**
- UptimeRobot sends alert (within 5 minutes)
- PM2 detects crash and restarts
- Health check script fails

**Response:**
1. Check PM2 logs: `pm2 logs url-shortener --lines 50`
2. Check system resources: `pm2 monit`
3. Check database: `psql -c "SELECT 1"`
4. Restart if needed: `pm2 restart url-shortener`

### Scenario 2: High Error Rate

**Detection:**
- Log monitoring shows spike in errors
- Metrics endpoint shows increased error count

**Response:**
1. Check recent errors: `pm2 logs url-shortener --err --lines 20`
2. Check database connection
3. Check disk space: `df -h`
4. Review recent deployments

### Scenario 3: High Memory Usage

**Detection:**
- PM2 shows high memory usage
- Metrics endpoint reports high memory

**Response:**
1. Check for memory leaks
2. Review database connection pool size
3. Restart application: `pm2 reload url-shortener`
4. Monitor memory after restart

## Advanced Monitoring

### Prometheus + Grafana Setup

For production environments, consider Prometheus and Grafana:

**1. Install Prometheus:**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'url-shortener'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/metrics/prometheus'
```

**2. Install Grafana:**

```bash
docker run -d -p 3001:3000 grafana/grafana
```

**3. Create Grafana Dashboard:**
- Add Prometheus as data source
- Import dashboard or create custom panels
- Set up alerts in Grafana

### Application Performance Monitoring (APM)

Consider these APM solutions:

1. **New Relic** - Full-featured APM
2. **Datadog** - Infrastructure + APM
3. **Elastic APM** - Part of ELK stack
4. **AppDynamics** - Enterprise APM

### Log Aggregation

For better log management:

1. **Loki + Grafana** - Lightweight log aggregation
2. **ELK Stack** - Elasticsearch, Logstash, Kibana
3. **CloudWatch Logs** - AWS native
4. **Papertrail** - Simple hosted solution

## Cost Comparison

| Solution | Cost | Setup Time | Features |
|----------|------|------------|----------|
| PM2 Built-in | Free | 0 min | Basic metrics |
| UptimeRobot | Free | 5 min | Uptime, alerts |
| Healthchecks.io | Free | 10 min | Cron monitoring |
| Custom Scripts | Free | 30 min | Custom metrics |
| Prometheus + Grafana | Free | 2 hours | Advanced metrics |
| New Relic | $99+/mo | 1 hour | Full APM |
| Datadog | $15+/mo | 1 hour | Full stack |

## Recommended Setup (30 Minutes)

For a quick, effective monitoring setup:

1. **Set up UptimeRobot** (5 min)
   - Monitor `/api/health` endpoint
   - Configure email alerts

2. **Use PM2 monitoring** (5 min)
   ```bash
   pm2 monit
   pm2 install pm2-slack
   ```

3. **Create health check script** (10 min)
   - Add to cron for every 5 minutes
   - Send alerts to Slack

4. **Set up log monitoring** (10 min)
   ```bash
   # Add to cron
   */30 * * * * grep ERROR /path/to/logs | mail -s "Errors" admin@example.com
   ```

## Testing Your Monitoring

Verify your monitoring setup:

```bash
# 1. Test health endpoint
curl http://localhost:3000/api/health

# 2. Test metrics endpoint
curl http://localhost:3000/api/metrics

# 3. Simulate service down
pm2 stop url-shortener
# Wait for alert, then restart
pm2 start url-shortener

# 4. Generate test errors
# Make invalid requests to trigger errors

# 5. Check if alerts are received
# Verify Slack/email notifications
```

## Next Steps

- [ ] Set up basic uptime monitoring
- [ ] Configure alert notifications
- [ ] Create monitoring dashboard
- [ ] Set up log aggregation (optional)
- [ ] Configure advanced APM (optional)
- [ ] Document runbooks for common issues
- [ ] Schedule regular monitoring reviews

## Resources

- [PM2 Monitoring Docs](https://pm2.keymetrics.io/docs/usage/monitoring/)
- [Prometheus Node.js Client](https://github.com/siimon/prom-client)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [UptimeRobot Docs](https://uptimerobot.com/api/)
