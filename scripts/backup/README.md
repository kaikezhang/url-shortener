# Database Backup Scripts

Automated backup and restore scripts for the URL Shortener PostgreSQL database.

## Quick Start

### Automated Setup

Run the interactive setup wizard:

```bash
sudo ./setup.sh
```

### Manual Backup

Create a one-time backup:

```bash
./backup.sh
```

### Restore Database

Restore from the latest backup:

```bash
./restore.sh latest
```

## Available Scripts

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

## Features

- ✅ Automated backup scheduling (cron or systemd)
- ✅ Compressed backups (gzip)
- ✅ Automatic rotation and cleanup
- ✅ Configurable retention period
- ✅ Safety backups before restore
- ✅ Integrity verification
- ✅ Detailed logging
- ✅ Error handling and rollback

## Documentation

For complete documentation, see [BACKUP.md](../../BACKUP.md) in the project root.

## Environment Variables

Configure via `.env` file:

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
- Either `cron` or `systemd` for scheduling

## Support

- 📖 [Full Documentation](../../BACKUP.md)
- 🚀 [Deployment Guide](../../DEPLOYMENT.md)
- 🗄️ [Database Guide](../../DATABASE.md)
