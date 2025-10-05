#!/bin/bash

################################################################################
# Railway Database Backup Script
#
# This script connects to Railway's managed PostgreSQL database remotely
# and creates compressed backups with automatic rotation.
#
# Prerequisites:
# - Railway CLI installed (or use DATABASE_URL from Railway dashboard)
# - PostgreSQL client tools (pg_dump)
################################################################################

set -e

# Load environment variables
if [ -f "$(dirname "$0")/../../.env" ]; then
    source "$(dirname "$0")/../../.env"
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/railway}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/railway_backup_${DATE}.sql"
BACKUP_FILE_COMPRESSED="${BACKUP_FILE}.gz"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Get DATABASE_URL from Railway
if [ -z "$DATABASE_URL" ]; then
    # Try to get from Railway CLI
    if command -v railway &> /dev/null; then
        log "Getting DATABASE_URL from Railway CLI..."
        export DATABASE_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")
    fi

    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL not found. Please set it in .env or use Railway CLI"
        echo ""
        echo "To get your DATABASE_URL:"
        echo "  1. Go to Railway dashboard → Your Project → PostgreSQL"
        echo "  2. Click 'Connect' tab"
        echo "  3. Copy the DATABASE_URL (starts with postgresql://)"
        echo "  4. Add to .env file: DATABASE_URL=postgresql://..."
        echo ""
        echo "Or install Railway CLI and run: railway login"
        exit 1
    fi
fi

# Create backup directory
mkdir -p "${BACKUP_DIR}"

log "Starting Railway database backup..."
log "Backup directory: ${BACKUP_DIR}"

# Perform backup
log "Creating backup file: ${BACKUP_FILE}"
if pg_dump "${DATABASE_URL}" \
    --format=plain \
    --no-owner \
    --no-acl \
    --verbose \
    > "${BACKUP_FILE}" 2>&1; then
    log "Database dump completed successfully"
else
    error "Database dump failed"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Compress backup
log "Compressing backup..."
if gzip "${BACKUP_FILE}"; then
    log "Compression completed: ${BACKUP_FILE_COMPRESSED}"
    BACKUP_SIZE=$(du -h "${BACKUP_FILE_COMPRESSED}" | cut -f1)
    log "Backup size: ${BACKUP_SIZE}"
else
    error "Compression failed"
    exit 1
fi

# Cleanup old backups
log "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
DELETED_COUNT=0
while IFS= read -r old_backup; do
    rm -f "${old_backup}"
    log "Deleted old backup: $(basename "${old_backup}")"
    ((DELETED_COUNT++))
done < <(find "${BACKUP_DIR}" -name "railway_backup_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}")

if [ ${DELETED_COUNT} -gt 0 ]; then
    log "Deleted ${DELETED_COUNT} old backup(s)"
else
    log "No old backups to delete"
fi

# Verify backup
log "Verifying backup integrity..."
if gzip -t "${BACKUP_FILE_COMPRESSED}" 2>/dev/null; then
    log "Backup verification successful"
else
    error "Backup verification failed"
    exit 1
fi

# List current backups
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "railway_backup_*.sql.gz" -type f | wc -l | tr -d ' ')
log "Total backups stored: ${BACKUP_COUNT}"

log "Backup completed successfully!"
log "Backup file: ${BACKUP_FILE_COMPRESSED}"

exit 0
