#!/bin/bash

################################################################################
# Database Backup Script for URL Shortener
#
# This script creates compressed backups of the PostgreSQL database
# with automatic rotation to manage disk space.
################################################################################

# Exit on error
set -e

# Load environment variables from .env file if it exists
if [ -f "$(dirname "$0")/../../.env" ]; then
    source "$(dirname "$0")/../../.env"
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/var/backups/url-shortener}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-url_shortener}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/url_shortener_${DATE}.sql"
BACKUP_FILE_COMPRESSED="${BACKUP_FILE}.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

log "Starting database backup..."
log "Database: ${DB_NAME}"
log "Host: ${DB_HOST}:${DB_PORT}"
log "Backup directory: ${BACKUP_DIR}"

# Export password for pg_dump
export PGPASSWORD="${DB_PASSWORD}"

# Perform backup
log "Creating backup file: ${BACKUP_FILE}"
if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" \
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
done < <(find "${BACKUP_DIR}" -name "url_shortener_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}")

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
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "url_shortener_*.sql.gz" -type f | wc -l | tr -d ' ')
log "Total backups stored: ${BACKUP_COUNT}"

# Unset password
unset PGPASSWORD

log "Backup completed successfully!"
log "Backup file: ${BACKUP_FILE_COMPRESSED}"

exit 0
