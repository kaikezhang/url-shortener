# PM2 Production Monitoring Setup

Complete guide to setting up PM2 process management and monitoring for production.

## Table of Contents

- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Alerting](#alerting)
- [Troubleshooting](#troubleshooting)

## Quick Start

```bash
# 1. Build the application
npm run build

# 2. Start with PM2 (production)
npm run pm2:start

# 3. View monitoring dashboard
npm run pm2:monit

# 4. Save PM2 configuration
npm run pm2:save

# 5. Setup auto-start on boot
npm run pm2:startup
```

## Installation

### Install PM2 Globally

```bash
# Install PM2
npm install -g pm2

# Verify installation
pm2 --version
```

### PM2 Modules (Optional but Recommended)

```bash
# PM2 Log Rotation
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true

# PM2 Monitoring (for alerts)
pm2 install pm2-auto-pull  # Auto-pull from git
```

## Configuration

The project includes a production-ready `ecosystem.config.js`:

### Key Features

- **Cluster Mode**: Uses all CPU cores for load balancing
- **Auto-restart**: Automatically restarts on crashes
- **Memory Management**: Restarts if memory exceeds 500MB
- **Logging**: Centralized log management
- **Environment Support**: Production, staging, and development configs

### Ecosystem Configuration Breakdown

```javascript
{
  name: 'url-shortener',
  script: './dist/index.js',
  instances: 'max',              // Use all CPU cores
  exec_mode: 'cluster',          // Enable cluster mode
  max_memory_restart: '500M',    // Auto-restart on high memory
  autorestart: true,             // Auto-restart on crash
  max_restarts: 10,              // Max restart attempts
}
```

## Deployment

### First Time Deployment

```bash
# 1. Build the application
npm run build

# 2. Run database migration
npm run migrate

# 3. Start with PM2 (production)
npm run pm2:start

# 4. Check status
npm run pm2:status

# 5. View logs
npm run pm2:logs

# 6. Save PM2 process list
npm run pm2:save

# 7. Setup PM2 to start on system boot
npm run pm2:startup
# Follow the instructions printed by the command above
```

### Update/Redeploy

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Build
npm run build

# Graceful reload (zero-downtime)
npm run pm2:reload

# Or restart (with brief downtime)
npm run pm2:restart
```

### Environment-Specific Deployment

```bash
# Start in staging mode
npm run pm2:start:staging

# Or manually with custom env
pm2 start ecosystem.config.js --env staging
```

## Monitoring

### Real-Time Monitoring Dashboard

```bash
# Interactive monitoring dashboard
npm run pm2:monit

# Or directly
pm2 monit
```

**Shows:**
- CPU usage per process
- Memory usage per process
- Event loop latency
- Active requests
- Real-time logs

### Process Status

```bash
# View all processes
npm run pm2:status

# Detailed info for url-shortener
pm2 show url-shortener

# Process metrics
pm2 describe url-shortener
```

### Logs

```bash
# View real-time logs (all instances)
npm run pm2:logs

# View last 100 lines
pm2 logs url-shortener --lines 100

# View only errors
pm2 logs url-shortener --err

# View specific instance
pm2 logs url-shortener-0

# Clear logs
pm2 flush
```

**Log files location:**
- Output: `./logs/pm2-out.log`
- Errors: `./logs/pm2-error.log`

### Key Metrics to Monitor

1. **Memory Usage**
   ```bash
   pm2 show url-shortener | grep memory
   ```
   - Watch for memory leaks
   - Threshold: 500MB (auto-restart configured)

2. **CPU Usage**
   ```bash
   pm2 show url-shortener | grep cpu
   ```
   - Should be balanced across instances
   - High CPU might indicate performance issues

3. **Restart Count**
   ```bash
   pm2 show url-shortener | grep restart
   ```
   - Frequent restarts indicate problems
   - Investigate logs for crash causes

4. **Uptime**
   ```bash
   pm2 show url-shortener | grep uptime
   ```
   - Track stability
   - Low uptime = frequent crashes

## Alerting

### PM2 Plus (Cloud Monitoring - Free Tier Available)

PM2 Plus provides professional monitoring with alerts:

```bash
# Link to PM2 Plus
pm2 link <secret_key> <public_key>

# Configure alerts in PM2 Plus dashboard:
# - High CPU usage
# - High memory usage
# - Application crashes
# - Custom metrics
```

**Benefits:**
- Real-time monitoring dashboard
- Email/SMS/Slack alerts
- Historical metrics
- Custom alerts
- Transaction tracing (APM)

**Free Tier:**
- 1 server
- 7 days data retention
- Basic alerts

### Custom Alert Scripts

Create `scripts/monitoring/pm2-health-check.sh`:

```bash
#!/bin/bash

# Get PM2 process info
STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="url-shortener") | .pm2_env.status')
RESTARTS=$(pm2 jlist | jq -r '.[] | select(.name=="url-shortener") | .pm2_env.restart_time')
MEMORY=$(pm2 jlist | jq -r '.[] | select(.name=="url-shortener") | .monit.memory')

SLACK_WEBHOOK="your-slack-webhook-url"

# Alert if not running
if [ "$STATUS" != "online" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"⚠️ URL Shortener is $STATUS!\"}" \
        "$SLACK_WEBHOOK"
fi

# Alert if too many restarts (>5)
if [ "$RESTARTS" -gt 5 ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"⚠️ URL Shortener has restarted $RESTARTS times!\"}" \
        "$SLACK_WEBHOOK"
fi

# Alert if memory is high (>400MB)
if [ "$MEMORY" -gt 419430400 ]; then
    MEMORY_MB=$((MEMORY / 1024 / 1024))
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"⚠️ URL Shortener using ${MEMORY_MB}MB memory!\"}" \
        "$SLACK_WEBHOOK"
fi
```

Add to cron:
```bash
# Check every 5 minutes
*/5 * * * * /path/to/scripts/monitoring/pm2-health-check.sh
```

### Notification Modules

Install PM2 notification modules:

```bash
# Slack notifications
pm2 install pm2-slack
pm2 set pm2-slack:slack_url https://hooks.slack.com/services/YOUR/WEBHOOK/URL
pm2 set pm2-slack:servername "Production Server"

# Discord notifications
pm2 install pm2-discord
pm2 set pm2-discord:discord_url https://discord.com/api/webhooks/YOUR/WEBHOOK

# Email notifications (requires Keymetrics account)
pm2 install pm2-email
```

## Advanced Features

### Process Management Commands

```bash
# Graceful reload (zero-downtime)
pm2 reload url-shortener

# Restart all instances
pm2 restart url-shortener

# Stop (but keep in process list)
pm2 stop url-shortener

# Start stopped process
pm2 start url-shortener

# Delete from PM2
pm2 delete url-shortener

# Restart specific instance
pm2 restart url-shortener-0
```

### Scaling

```bash
# Scale to 4 instances
pm2 scale url-shortener 4

# Scale up by 2
pm2 scale url-shortener +2

# Scale down by 1
pm2 scale url-shortener -1

# Reset to 'max' (all cores)
pm2 delete url-shortener
pm2 start ecosystem.config.js
```

### Startup Script

Ensure PM2 starts on system boot:

```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# Run the generated command
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

# Save current process list
pm2 save

# To disable startup
pm2 unstartup systemd
```

### Update PM2

```bash
# Update PM2
npm install -g pm2@latest

# Update daemon
pm2 update
```

## Monitoring Best Practices

### 1. Regular Health Checks

```bash
# Create a daily health check script
cat > /usr/local/bin/pm2-daily-check.sh <<'EOF'
#!/bin/bash
echo "PM2 Health Check - $(date)"
pm2 status
pm2 describe url-shortener | grep -E "restarts|memory|cpu"
EOF

chmod +x /usr/local/bin/pm2-daily-check.sh

# Add to cron
echo "0 9 * * * /usr/local/bin/pm2-daily-check.sh | mail -s 'PM2 Daily Report' admin@example.com" | crontab -
```

### 2. Log Analysis

```bash
# Check for errors in last hour
pm2 logs url-shortener --lines 1000 | grep -i error | tail -20

# Monitor for specific patterns
pm2 logs url-shortener | grep -E "ECONNREFUSED|timeout|fatal"

# Count errors per hour
pm2 logs url-shortener --lines 10000 | grep ERROR | wc -l
```

### 3. Performance Monitoring

```bash
# Monitor event loop latency
pm2 describe url-shortener | grep "event loop"

# Check if instances are balanced
pm2 list | grep url-shortener

# Memory trend analysis
watch -n 5 "pm2 show url-shortener | grep memory"
```

### 4. Automated Responses

Create `scripts/monitoring/auto-heal.sh`:

```bash
#!/bin/bash

# Auto-heal if too many restarts
RESTARTS=$(pm2 jlist | jq -r '.[] | select(.name=="url-shortener") | .pm2_env.restart_time')

if [ "$RESTARTS" -gt 10 ]; then
    echo "Too many restarts detected. Clearing and restarting..."
    pm2 delete url-shortener
    npm run build
    npm run pm2:start
    pm2 save
fi
```

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs url-shortener --err --lines 50

# Verify build
ls -la dist/

# Test manually
node dist/index.js

# Check PM2 config
cat ecosystem.config.js

# Restart PM2 daemon
pm2 kill
pm2 start ecosystem.config.js
```

### High Memory Usage

```bash
# Check memory per instance
pm2 show url-shortener | grep memory

# Reduce max memory restart threshold (ecosystem.config.js)
max_memory_restart: '300M'

# Reduce number of instances
pm2 scale url-shortener 2

# Reload to clear memory
pm2 reload url-shortener
```

### Frequent Restarts

```bash
# Check restart count
pm2 show url-shortener | grep restart

# View error logs
pm2 logs url-shortener --err --lines 100

# Common causes:
# - Uncaught exceptions
# - Memory leaks
# - Database connection issues
# - Port conflicts

# Increase restart delay
# In ecosystem.config.js:
min_uptime: '30s'
max_restarts: 5
```

### PM2 Not Starting on Boot

```bash
# Check systemd service
systemctl status pm2-username

# Re-generate startup script
pm2 unstartup
pm2 startup
# Run the generated command
pm2 save

# Verify service
systemctl list-units | grep pm2
```

### Logs Not Rotating

```bash
# Check pm2-logrotate module
pm2 list | grep pm2-logrotate

# Reinstall if needed
pm2 uninstall pm2-logrotate
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Manually rotate
pm2 flush
```

## Production Checklist

- [ ] PM2 installed globally
- [ ] Built application (`npm run build`)
- [ ] Database migrated (`npm run migrate`)
- [ ] PM2 process started (`npm run pm2:start`)
- [ ] PM2 configuration saved (`pm2 save`)
- [ ] Startup script configured (`pm2 startup`)
- [ ] Log rotation installed and configured
- [ ] Monitoring alerts set up (PM2 Plus or custom)
- [ ] Health check scripts in cron
- [ ] Tested auto-restart on crash
- [ ] Tested graceful reload
- [ ] Verified all instances running
- [ ] Logs accessible and rotating
- [ ] Slack/email notifications working

## Useful Commands Reference

```bash
# Start/Stop
npm run pm2:start           # Start in production
npm run pm2:start:staging   # Start in staging
npm run pm2:stop            # Stop application
npm run pm2:restart         # Restart (with downtime)
npm run pm2:reload          # Reload (zero-downtime)
npm run pm2:delete          # Remove from PM2

# Monitoring
npm run pm2:monit           # Interactive dashboard
npm run pm2:status          # Process status
npm run pm2:logs            # View logs
pm2 show url-shortener      # Detailed info
pm2 describe url-shortener  # Metrics

# Management
pm2 scale url-shortener 4   # Scale to 4 instances
pm2 flush                   # Clear logs
pm2 save                    # Save process list
pm2 resurrect              # Restore saved processes
pm2 update                  # Update PM2 daemon

# Advanced
pm2 startup                 # Setup auto-start
pm2 unstartup              # Remove auto-start
pm2 kill                    # Kill PM2 daemon
pm2 ping                    # Test PM2 daemon
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Deploy with PM2
  run: |
    npm install
    npm run build
    pm2 reload ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
    pm2 save
```

### Systemd Service (Alternative to PM2 Startup)

Create `/etc/systemd/system/url-shortener.service`:

```ini
[Unit]
Description=URL Shortener (PM2)
After=network.target

[Service]
Type=forking
User=deploy
WorkingDirectory=/var/www/url-shortener
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 stop url-shortener
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Next Steps

- Set up PM2 Plus for cloud monitoring
- Configure custom alerts for your team
- Integrate with your CI/CD pipeline
- Set up log aggregation (ELK, Loki, etc.)
- Monitor database query performance
- Implement distributed tracing

## Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 Plus](https://pm2.io/docs/plus/overview/)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [PM2 Deployment](https://pm2.keymetrics.io/docs/usage/deployment/)
