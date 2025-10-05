# Railway Database Backup Quick Start

Quick guide for backing up Railway PostgreSQL databases.

## Prerequisites

- Railway account with PostgreSQL database
- PostgreSQL client tools (`pg_dump`, `psql`)
- Railway CLI (optional but recommended)

## Quick Setup

### 1. Get Your DATABASE_URL

**Option A: Railway Dashboard**
```
1. Go to Railway dashboard
2. Select your PostgreSQL database
3. Click "Connect" tab
4. Copy the DATABASE_URL (starts with postgresql://)
```

**Option B: Railway CLI**
```bash
railway login
railway variables get DATABASE_URL
```

### 2. Configure Environment

Add to `.env`:
```env
DATABASE_URL=postgresql://user:password@host:port/database
BACKUP_DIR=./backups/railway
BACKUP_RETENTION_DAYS=7
```

### 3. Create Your First Backup

```bash
# Run backup
./scripts/backup/backup-railway.sh

# Check backup was created
ls -lh backups/railway/
```

## Automated Backups with GitHub Actions

### Setup GitHub Actions (Recommended)

1. **Add DATABASE_URL to GitHub Secrets:**
   ```
   GitHub repo → Settings → Secrets and variables → Actions
   New repository secret:
     Name: DATABASE_URL
     Value: postgresql://... (your Railway database URL)
   ```

2. **The workflow is already configured** (`.github/workflows/railway-backup.yml`)
   - Runs daily at 2 AM UTC
   - Stores backups in GitHub Artifacts (7 days)
   - Can be triggered manually

3. **Manual trigger:**
   ```bash
   # Using GitHub CLI
   gh workflow run railway-backup.yml

   # Or use GitHub web interface:
   # Actions → Railway Database Backup → Run workflow
   ```

4. **Download backups:**
   ```bash
   # List workflow runs
   gh run list --workflow=railway-backup.yml

   # Download specific backup
   gh run download <run-id>
   ```

## Restore Database

### Restore from Latest Backup

```bash
./scripts/backup/restore-railway.sh latest
```

### Restore from Specific Backup

```bash
./scripts/backup/restore-railway.sh railway_backup_20251005_120000.sql.gz
```

### Restore to Different Database

```bash
# Use a different DATABASE_URL for testing
DATABASE_URL=postgresql://test-db-url ./scripts/backup/restore-railway.sh latest
```

## Common Tasks

### List All Backups

```bash
ls -lth backups/railway/
```

### Test Database Connection

```bash
psql "$DATABASE_URL" -c '\l'
```

### Manual Backup with Custom Retention

```bash
BACKUP_RETENTION_DAYS=14 ./scripts/backup/backup-railway.sh
```

### Verify Backup Integrity

```bash
gzip -t backups/railway/railway_backup_*.sql.gz
```

## Backup Schedules

### Development
- Manual backups before major changes
- GitHub Actions: weekly

### Staging
- GitHub Actions: daily at 2 AM UTC

### Production
- GitHub Actions: every 6 hours
- Railway Pro: automatic daily backups (built-in)

## Railway Pro vs Free Plan

| Feature | Free Plan | Pro Plan |
|---------|-----------|----------|
| Railway Auto Backups | ❌ No | ✅ Yes (daily) |
| Custom Backups (these scripts) | ✅ Yes | ✅ Yes |
| GitHub Actions Backups | ✅ Yes | ✅ Yes |
| Point-in-time Recovery | ❌ No | ✅ Yes |

**Recommendation:**
- **Free Plan:** Use GitHub Actions for automated backups
- **Pro Plan:** Use both Railway backups + GitHub Actions for redundancy

## Storage Options

### GitHub Artifacts (Default)
- ✅ Free
- ✅ Easy setup
- ⚠️ 7-day retention
- ⚠️ Limited to workflow runs

### AWS S3 (Optional)
- ✅ Long-term storage
- ✅ Unlimited retention
- ⚠️ Requires AWS account
- ⚠️ Small cost

To enable S3 uploads, edit `.github/workflows/railway-backup.yml`:
```yaml
- name: Upload to S3 (optional)
  if: true  # Change from false to true
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## Troubleshooting

### "DATABASE_URL not found"
```bash
# Check if set
echo $DATABASE_URL

# Add to .env
echo 'DATABASE_URL=postgresql://...' >> .env
```

### "Connection refused"
- Check Railway database is running (not paused)
- Verify DATABASE_URL is correct
- Test connection: `psql "$DATABASE_URL" -c '\l'`

### "Permission denied"
- Verify DATABASE_URL includes correct credentials
- Check user has necessary permissions

### GitHub Actions failing
- Verify DATABASE_URL secret is set correctly
- Check workflow logs for specific error
- Ensure PostgreSQL client is installed in workflow

## Security Best Practices

1. **Never commit DATABASE_URL to git**
   - Use `.env` file (already in `.gitignore`)
   - Use GitHub Secrets for CI/CD

2. **Secure backup storage**
   - Encrypt backups if storing externally
   - Use private S3 buckets if enabling S3 upload

3. **Rotate credentials**
   - If DATABASE_URL is exposed, regenerate in Railway
   - Update GitHub Secrets immediately

4. **Monitor access**
   - Review GitHub Actions runs regularly
   - Check Railway dashboard for unusual activity

## Next Steps

1. ✅ Set up automated backups (GitHub Actions or cron)
2. ✅ Test restore procedure
3. ✅ Configure off-site storage (optional)
4. ✅ Set up monitoring/alerts
5. ✅ Document recovery procedures for your team

## Resources

- [Full Backup Documentation](../../BACKUP.md)
- [Railway Documentation](https://docs.railway.app/databases/postgresql)
- [GitHub Actions Documentation](https://docs.github.com/actions)

## Support

For issues:
- Check [BACKUP.md troubleshooting section](../../BACKUP.md#troubleshooting)
- Review workflow logs in GitHub Actions
- Check Railway status page
