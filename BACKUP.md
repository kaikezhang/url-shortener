# Database Backup Guide

This guide covers database backup and restore procedures for the URL Shortener service.

## Table of Contents

- [Quick Start](#quick-start)
- [Automated Setup](#automated-setup)
- [Manual Setup](#manual-setup)
- [Backup Scripts](#backup-scripts)
- [Restore Procedures](#restore-procedures)
- [Scheduling Options](#scheduling-options)
- [Configuration](#configuration)
- [Monitoring](#monitoring)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Automated Setup (Recommended)

Run the interactive setup script to configure automated backups:

```bash
# Run the setup script
cd /path/to/url-shorter
sudo ./scripts/backup/setup.sh
```

The setup script will:
- Create backup directories
- Configure backup retention
- Set up automated scheduling (cron or systemd)
- Perform a test backup

### Manual Backup

Create a one-time backup:

```bash
./scripts/backup/backup.sh
```

### Restore from Backup

Restore from the latest backup:

```bash
./scripts/backup/restore.sh latest
```

Or restore from a specific backup file:

```bash
./scripts/backup/restore.sh url_shortener_20251005_120000.sql.gz
```

## Backup Scripts

### backup.sh

Creates compressed database backups with automatic rotation.

**Features:**
- Compressed backups using gzip
- Automatic cleanup of old backups
- Configurable retention period
- Backup verification
- Detailed logging
- Error handling

**Usage:**

```bash
# Basic usage (uses .env configuration)
./scripts/backup/backup.sh

# With custom retention
BACKUP_RETENTION_DAYS=14 ./scripts/backup/backup.sh

# With custom backup directory
BACKUP_DIR=/custom/path ./scripts/backup/backup.sh
```

**Output:**

```
[2025-10-05 12:00:00] Starting database backup...
[2025-10-05 12:00:00] Database: url_shortener
[2025-10-05 12:00:00] Host: localhost:5432
[2025-10-05 12:00:00] Backup directory: /var/backups/url-shortener
[2025-10-05 12:00:05] Creating backup file: /var/backups/url-shortener/url_shortener_20251005_120000.sql
[2025-10-05 12:00:10] Database dump completed successfully
[2025-10-05 12:00:10] Compressing backup...
[2025-10-05 12:00:12] Compression completed: /var/backups/url-shortener/url_shortener_20251005_120000.sql.gz
[2025-10-05 12:00:12] Backup size: 2.5M
[2025-10-05 12:00:12] Cleaning up old backups (retention: 7 days)...
[2025-10-05 12:00:12] Deleted 3 old backup(s)
[2025-10-05 12:00:12] Backup verification successful
[2025-10-05 12:00:12] Total backups stored: 7
[2025-10-05 12:00:12] Backup completed successfully!
```

### restore.sh

Restores the database from a backup file with safety features.

**Features:**
- Lists available backups
- Integrity verification before restore
- Safety backup before restore
- Automatic rollback on failure
- Confirmation prompts

**Usage:**

```bash
# List available backups (no argument)
./scripts/backup/restore.sh

# Restore latest backup
./scripts/backup/restore.sh latest

# Restore specific backup
./scripts/backup/restore.sh url_shortener_20251005_120000.sql.gz

# Restore from custom path
./scripts/backup/restore.sh /path/to/backup.sql.gz
```

**Example Output:**

```
[2025-10-05 12:30:00] Using latest backup: url_shortener_20251005_120000.sql.gz
[2025-10-05 12:30:00] Verifying backup integrity...
[2025-10-05 12:30:01] Backup file integrity verified
[2025-10-05 12:30:01] Restore Information:
[2025-10-05 12:30:01]   Backup file: url_shortener_20251005_120000.sql.gz
[2025-10-05 12:30:01]   Backup size: 2.5M
[2025-10-05 12:30:01]   Target database: url_shortener
[2025-10-05 12:30:01]   Target host: localhost:5432

[2025-10-05 12:30:01] WARNING: This will REPLACE all data in the database 'url_shortener'
Are you sure you want to continue? (yes/no): yes

[2025-10-05 12:30:05] Testing database connection...
[2025-10-05 12:30:05] Database connection successful
[2025-10-05 12:30:05] Creating safety backup of current database...
[2025-10-05 12:30:08] Safety backup created: pre_restore_20251005_123005.sql.gz
[2025-10-05 12:30:08] Dropping existing database...
[2025-10-05 12:30:09] Creating fresh database...
[2025-10-05 12:30:10] Restoring database from backup...
[2025-10-05 12:30:25] Database restored successfully
[2025-10-05 12:30:25] Verifying restored database...
[2025-10-05 12:30:25] Restored database contains 1234 URLs
[2025-10-05 12:30:25] Restore completed successfully!
```

## Automated Setup

The `setup.sh` script provides an interactive way to configure automated backups.

### Running Setup

```bash
sudo ./scripts/backup/setup.sh
```

The script will:

1. **Detect your init system** (systemd or cron)
2. **Configure backup settings:**
   - Backup directory location
   - Retention period
   - Backup schedule
3. **Update .env file** with backup configuration
4. **Install automation:**
   - For systemd: Install and enable timer
   - For cron: Add crontab entry
5. **Run test backup** (optional)

### Setup Example

```
=========================================
  URL Shortener Backup Setup
=========================================

[INFO] Detected systemd

Backup Configuration

Backup directory [/var/backups/url-shortener]: /var/backups/url-shortener
Retention period in days [7]: 7

Backup Schedule Options:
  1) Daily at 2:00 AM (recommended for most sites)
  2) Every 6 hours (recommended for high-traffic sites)
  3) Every 4 hours
  4) Hourly
  5) Custom

Select backup schedule [1]: 2

[2025-10-05 12:00:00] Creating backup directory: /var/backups/url-shortener
[2025-10-05 12:00:00] Updating .env file with backup configuration...
[2025-10-05 12:00:00] Setting up systemd timer...
[2025-10-05 12:00:01] Systemd timer installed and started

Run a test backup now? (yes/no): yes
```

## Manual Setup

If you prefer manual configuration, follow these steps:

### Step 1: Configure Environment

Add to your `.env` file:

```env
# Backup Configuration
BACKUP_DIR=/var/backups/url-shortener
BACKUP_RETENTION_DAYS=7
```

### Step 2: Create Backup Directory

```bash
sudo mkdir -p /var/backups/url-shortener
sudo chmod 750 /var/backups/url-shortener
```

### Step 3A: Setup with Cron

Edit your crontab:

```bash
crontab -e
```

Add one of these schedules:

```cron
# Daily at 2:00 AM
0 2 * * * cd /path/to/url-shorter && /path/to/url-shorter/scripts/backup/backup.sh >> /var/log/url-shortener-backup.log 2>&1

# Every 6 hours
0 */6 * * * cd /path/to/url-shorter && /path/to/url-shorter/scripts/backup/backup.sh >> /var/log/url-shortener-backup.log 2>&1

# Hourly
0 * * * * cd /path/to/url-shorter && /path/to/url-shorter/scripts/backup/backup.sh >> /var/log/url-shortener-backup.log 2>&1
```

### Step 3B: Setup with Systemd

1. **Copy service file:**

```bash
sudo cp scripts/backup/url-shortener-backup.service /etc/systemd/system/
```

2. **Edit service file to update paths:**

```bash
sudo nano /etc/systemd/system/url-shortener-backup.service
# Update /path/to/url-shorter with your actual path
```

3. **Copy and configure timer:**

```bash
sudo cp scripts/backup/url-shortener-backup.timer /etc/systemd/system/
```

Edit timer for your desired schedule:

```bash
sudo nano /etc/systemd/system/url-shortener-backup.timer
```

4. **Enable and start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable url-shortener-backup.timer
sudo systemctl start url-shortener-backup.timer
```

5. **Verify:**

```bash
sudo systemctl status url-shortener-backup.timer
sudo systemctl list-timers url-shortener-backup.timer
```

## Scheduling Options

### Recommended Schedules by Traffic

**Low-traffic sites (< 100 URLs/day):**
- Daily backups at night
- Retention: 7 days

```cron
0 2 * * *
```

**Medium-traffic sites (100-1000 URLs/day):**
- Every 6 hours
- Retention: 7 days

```cron
0 */6 * * *
```

**High-traffic sites (> 1000 URLs/day):**
- Every 2-4 hours
- Retention: 3-7 days
- Consider database replication

```cron
0 */2 * * *
```

### Cron Schedule Examples

```cron
# Every hour
0 * * * *

# Every 2 hours
0 */2 * * *

# Every 4 hours
0 */4 * * *

# Every 6 hours
0 */6 * * *

# Daily at 2 AM
0 2 * * *

# Twice daily (2 AM and 2 PM)
0 2,14 * * *

# Weekdays at 9 AM
0 9 * * 1-5

# Weekly on Sunday at 3 AM
0 3 * * 0
```

### Systemd Timer Examples

```ini
# Daily at 2 AM
OnCalendar=02:00

# Every 6 hours
OnCalendar=00/6:00

# Hourly
OnCalendar=hourly

# Every 4 hours
OnCalendar=00/4:00

# Multiple times
OnCalendar=02:00
OnCalendar=14:00
```

## Configuration

### Environment Variables

Configure backups via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKUP_DIR` | `/var/backups/url-shortener` | Directory to store backups |
| `BACKUP_RETENTION_DAYS` | `7` | Number of days to keep backups |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `url_shortener` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | - | Database password |

### Example Configuration

**Development (.env):**

```env
BACKUP_DIR=./backups
BACKUP_RETENTION_DAYS=3
```

**Staging (.env.staging):**

```env
BACKUP_DIR=/var/backups/url-shortener-staging
BACKUP_RETENTION_DAYS=7
```

**Production (.env.production):**

```env
BACKUP_DIR=/var/backups/url-shortener
BACKUP_RETENTION_DAYS=14
```

## Monitoring

### Check Backup Status

**With systemd:**

```bash
# Check timer status
systemctl status url-shortener-backup.timer

# View next scheduled run
systemctl list-timers url-shortener-backup.timer

# View recent backup logs
journalctl -u url-shortener-backup.service -n 50

# Follow live logs
journalctl -u url-shortener-backup.service -f
```

**With cron:**

```bash
# View backup logs
tail -f /var/log/url-shortener-backup.log

# Check recent backups
ls -lth /var/backups/url-shortener/ | head

# View cron job
crontab -l | grep url-shortener
```

### List Backups

```bash
# List all backups
ls -lh /var/backups/url-shortener/

# List with dates
ls -lth /var/backups/url-shortener/

# Count backups
ls /var/backups/url-shortener/ | wc -l

# Show disk usage
du -sh /var/backups/url-shortener/
```

### Verify Backup Integrity

```bash
# Test latest backup
gzip -t /var/backups/url-shortener/url_shortener_*.sql.gz | tail -1

# Test all backups
for file in /var/backups/url-shortener/*.sql.gz; do
    gzip -t "$file" && echo "✓ $file" || echo "✗ $file"
done
```

## Best Practices

### 1. Test Restore Regularly

Test your restore procedure monthly:

```bash
# Create test database
createdb url_shortener_test

# Restore to test database
DB_NAME=url_shortener_test ./scripts/backup/restore.sh latest

# Verify data
psql url_shortener_test -c "SELECT COUNT(*) FROM urls;"

# Clean up
dropdb url_shortener_test
```

### 2. Off-site Backups

For production, copy backups to remote storage:

```bash
# Using rsync to remote server
rsync -avz /var/backups/url-shortener/ backup-server:/backups/url-shortener/

# Using AWS S3
aws s3 sync /var/backups/url-shortener/ s3://my-bucket/url-shortener-backups/

# Using Google Cloud Storage
gsutil -m rsync -r /var/backups/url-shortener/ gs://my-bucket/url-shortener-backups/
```

### 3. Monitor Backup Size

Track backup size trends:

```bash
# Check total size
du -sh /var/backups/url-shortener/

# Size trend
du -h /var/backups/url-shortener/*.sql.gz | sort -k2
```

### 4. Alert on Failures

**With systemd:**

Configure OnFailure in service file:

```ini
[Unit]
OnFailure=backup-failure-notify@%n.service
```

**With cron and email:**

```cron
MAILTO=admin@example.com
0 2 * * * /path/to/backup.sh
```

### 5. Document Recovery Procedures

Keep recovery instructions accessible:

```bash
# Create recovery runbook
cat > /var/backups/url-shortener/RECOVERY.txt <<EOF
Emergency Database Recovery Procedure

1. Stop application:
   systemctl stop url-shortener

2. Restore database:
   cd /path/to/url-shorter
   ./scripts/backup/restore.sh latest

3. Verify data:
   psql url_shortener -c "SELECT COUNT(*) FROM urls;"

4. Start application:
   systemctl start url-shortener

5. Test application:
   curl https://your-domain.com/api/health

Emergency Contact: admin@example.com
EOF
```

## Troubleshooting

### Backup Script Fails

**Check database connection:**

```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c '\q'
```

**Check disk space:**

```bash
df -h /var/backups/url-shortener/
```

**Check permissions:**

```bash
ls -ld /var/backups/url-shortener/
```

**View detailed logs:**

```bash
# Run manually to see errors
./scripts/backup/backup.sh

# Or check system logs
journalctl -xe
```

### Restore Fails

**Check backup integrity:**

```bash
gzip -t /var/backups/url-shortener/url_shortener_20251005_120000.sql.gz
```

**Verify database exists:**

```bash
psql -h $DB_HOST -U $DB_USER -l | grep url_shortener
```

**Check database permissions:**

```bash
psql -h $DB_HOST -U $DB_USER -d postgres -c "SELECT has_database_privilege('$DB_USER', 'url_shortener', 'CREATE');"
```

### Cron Job Not Running

**Check cron service:**

```bash
systemctl status cron
# or
systemctl status crond
```

**Verify crontab:**

```bash
crontab -l | grep url-shortener
```

**Check cron logs:**

```bash
# Ubuntu/Debian
grep CRON /var/log/syslog | grep url-shortener

# CentOS/RHEL
grep CRON /var/log/cron | grep url-shortener
```

### Systemd Timer Not Running

**Check timer status:**

```bash
systemctl status url-shortener-backup.timer
```

**Check service status:**

```bash
systemctl status url-shortener-backup.service
```

**View timer schedule:**

```bash
systemctl list-timers url-shortener-backup.timer
```

**Reload systemd if needed:**

```bash
sudo systemctl daemon-reload
sudo systemctl restart url-shortener-backup.timer
```

## Advanced Topics

### Incremental Backups

For large databases, consider incremental backups using WAL archiving:

```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'test ! -f /var/backups/wal/%f && cp %p /var/backups/wal/%f'
```

### Database Replication

For high-availability:

1. Set up PostgreSQL streaming replication
2. Use replicas for read queries
3. Promote replica on primary failure

### Backup Encryption

Encrypt sensitive backups:

```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Decrypt backup
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

### Backup to Cloud Storage

Example script for S3:

```bash
#!/bin/bash
# After backup completes
aws s3 cp /var/backups/url-shortener/ s3://my-bucket/backups/ \
    --recursive \
    --exclude "*" \
    --include "url_shortener_$(date +%Y%m%d)*.sql.gz"
```

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [DATABASE.md](./DATABASE.md) - Database configuration
- [README.md](./README.md) - Project overview

## Support

For issues or questions:
- Check troubleshooting section above
- Review application logs
- Consult PostgreSQL documentation
- Open an issue on GitHub
