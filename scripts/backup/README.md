# Database Backup Scripts

Automated backup and restore scripts for the URL Shortener PostgreSQL database.

## Quick Start

### For Railway Databases 🚂

If you're using Railway's managed PostgreSQL:

```bash
# See Railway-specific guide
cat RAILWAY.md

# Or create backup directly
./backup-railway.sh
```

**[→ Railway Quick Start Guide](./RAILWAY.md)**

### For Self-Hosted Databases

#### Automated Setup

Run the interactive setup wizard:

```bash
sudo ./setup.sh
```

#### Manual Backup

Create a one-time backup:

```bash
./backup.sh
```

#### Restore Database

Restore from the latest backup:

```bash
./restore.sh latest
```

## Available Scripts

### Railway Database Scripts

| Script | Purpose |
|--------|---------|
| `backup-railway.sh` | Backup Railway PostgreSQL database remotely |
| `restore-railway.sh` | Restore Railway database from backup |

### Self-Hosted Database Scripts

| Script | Purpose |
|--------|---------|
| `setup.sh` | Interactive setup wizard for automated backups |
| `backup.sh` | Create compressed database backup with rotation |
| `restore.sh` | Restore database from backup file |

## Configuration Files

| File | Purpose |
|------|---------|
| `crontab.example` | Example cron schedules |
| `url-shortener-backup.service` | Systemd service unit |
| `url-shortener-backup.timer` | Systemd timer unit |
| `RAILWAY.md` | Railway database backup quick start guide |

## Features

- ✅ Automated backup scheduling (cron or systemd)
- ✅ Compressed backups (gzip)
- ✅ Automatic rotation and cleanup
- ✅ Configurable retention period
- ✅ Safety backups before restore
- ✅ Integrity verification
- ✅ Detailed logging
- ✅ Error handling and rollback
- ✅ Railway database support
- ✅ GitHub Actions automation

## Documentation

- **[RAILWAY.md](./RAILWAY.md)** - Railway database backup quick start
- **[BACKUP.md](../../BACKUP.md)** - Complete backup documentation

## Environment Variables

### For Railway Databases

```env
DATABASE_URL=postgresql://user:password@host:port/database
BACKUP_DIR=./backups/railway
BACKUP_RETENTION_DAYS=7
```

### For Self-Hosted Databases

```env
BACKUP_DIR=/var/backups/url-shortener
BACKUP_RETENTION_DAYS=7
DB_HOST=localhost
DB_PORT=5432
DB_NAME=url_shortener
DB_USER=postgres
DB_PASSWORD=your_password
```

## Requirements

- PostgreSQL client tools (`pg_dump`, `psql`)
- `gzip` for compression
- Bash 4.0+
- Either `cron` or `systemd` for scheduling (self-hosted)
- Railway CLI (optional, for Railway backups)

## Support

- 📖 [Full Documentation](../../BACKUP.md)
- 🚂 [Railway Quick Start](./RAILWAY.md)
- 🚀 [Deployment Guide](../../DEPLOYMENT.md)
- 🗄️ [Database Guide](../../DATABASE.md)
