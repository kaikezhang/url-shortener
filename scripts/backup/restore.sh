#!/bin/bash

################################################################################
# Database Restore Script for URL Shortener
#
# This script restores the PostgreSQL database from a backup file.
# Usage: ./restore.sh [backup_file]
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

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Function to list available backups
list_backups() {
    log "Available backups in ${BACKUP_DIR}:"
    echo ""
    find "${BACKUP_DIR}" -name "url_shortener_*.sql.gz" -type f -printf "%T@ %p\n" | sort -rn | while read -r timestamp filepath; do
        size=$(du -h "${filepath}" | cut -f1)
        date=$(date -r "${filepath}" '+%Y-%m-%d %H:%M:%S')
        echo "  $(basename "${filepath}") - ${date} - ${size}"
    done
    echo ""
}

# Check if backup file is provided
if [ -z "$1" ]; then
    error "No backup file specified"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo "   or: $0 latest"
    echo ""

    if [ -d "${BACKUP_DIR}" ]; then
        list_backups
    fi
    exit 1
fi

# Determine backup file
if [ "$1" == "latest" ]; then
    BACKUP_FILE=$(find "${BACKUP_DIR}" -name "url_shortener_*.sql.gz" -type f -printf "%T@ %p\n" | sort -rn | head -1 | cut -d' ' -f2)
    if [ -z "${BACKUP_FILE}" ]; then
        error "No backups found in ${BACKUP_DIR}"
        exit 1
    fi
    log "Using latest backup: $(basename "${BACKUP_FILE}")"
else
    # Check if full path or just filename
    if [ -f "$1" ]; then
        BACKUP_FILE="$1"
    elif [ -f "${BACKUP_DIR}/$1" ]; then
        BACKUP_FILE="${BACKUP_DIR}/$1"
    else
        error "Backup file not found: $1"
        list_backups
        exit 1
    fi
fi

# Verify backup file exists and is readable
if [ ! -f "${BACKUP_FILE}" ]; then
    error "Backup file does not exist: ${BACKUP_FILE}"
    exit 1
fi

if [ ! -r "${BACKUP_FILE}" ]; then
    error "Cannot read backup file: ${BACKUP_FILE}"
    exit 1
fi

# Verify backup integrity
log "Verifying backup integrity..."
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    if ! gzip -t "${BACKUP_FILE}" 2>/dev/null; then
        error "Backup file is corrupted or invalid"
        exit 1
    fi
    log "Backup file integrity verified"
fi

# Display restore information
log "Restore Information:"
log "  Backup file: $(basename "${BACKUP_FILE}")"
log "  Backup size: $(du -h "${BACKUP_FILE}" | cut -f1)"
log "  Target database: ${DB_NAME}"
log "  Target host: ${DB_HOST}:${DB_PORT}"
echo ""

# Confirmation prompt
warn "WARNING: This will REPLACE all data in the database '${DB_NAME}'"
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log "Restore cancelled by user"
    exit 0
fi

# Export password for psql
export PGPASSWORD="${DB_PASSWORD}"

# Test database connection
log "Testing database connection..."
if ! psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c '\q' 2>/dev/null; then
    error "Cannot connect to database server"
    exit 1
fi
log "Database connection successful"

# Create backup of current database before restore
SAFETY_BACKUP="${BACKUP_DIR}/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
log "Creating safety backup of current database..."
if pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" 2>/dev/null | gzip > "${SAFETY_BACKUP}"; then
    log "Safety backup created: $(basename "${SAFETY_BACKUP}")"
else
    warn "Failed to create safety backup (database may not exist yet)"
fi

# Drop and recreate database
log "Dropping existing database..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};" 2>/dev/null || true

log "Creating fresh database..."
psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null

# Restore from backup
log "Restoring database from backup..."
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    if gunzip -c "${BACKUP_FILE}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" > /dev/null 2>&1; then
        log "Database restored successfully"
    else
        error "Restore failed"
        log "Attempting to restore from safety backup..."
        if [ -f "${SAFETY_BACKUP}" ]; then
            gunzip -c "${SAFETY_BACKUP}" | psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" > /dev/null 2>&1
            error "Reverted to safety backup"
        fi
        exit 1
    fi
else
    if psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" < "${BACKUP_FILE}" > /dev/null 2>&1; then
        log "Database restored successfully"
    else
        error "Restore failed"
        exit 1
    fi
fi

# Verify restore
log "Verifying restored database..."
URL_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT COUNT(*) FROM urls;" 2>/dev/null | tr -d ' ')
log "Restored database contains ${URL_COUNT} URLs"

# Unset password
unset PGPASSWORD

log "Restore completed successfully!"
echo ""
log "Safety backup preserved at: $(basename "${SAFETY_BACKUP}")"

exit 0
