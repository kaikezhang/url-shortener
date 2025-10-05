#!/bin/bash

################################################################################
# Railway Database Restore Script
#
# This script restores Railway's PostgreSQL database from a backup file.
# Usage: ./restore-railway.sh [backup_file]
#
# WARNING: This will replace ALL data in the Railway database!
################################################################################

set -e

# Load environment variables
if [ -f "$(dirname "$0")/../../.env" ]; then
    source "$(dirname "$0")/../../.env"
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups/railway}"

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

# List available backups
list_backups() {
    log "Available backups in ${BACKUP_DIR}:"
    echo ""
    find "${BACKUP_DIR}" -name "railway_backup_*.sql.gz" -type f -exec ls -lh {} \; | awk '{print "  " $9 " - " $5 " - " $6 " " $7 " " $8}'
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

# Get DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    if command -v railway &> /dev/null; then
        log "Getting DATABASE_URL from Railway CLI..."
        export DATABASE_URL=$(railway variables get DATABASE_URL 2>/dev/null || echo "")
    fi

    if [ -z "$DATABASE_URL" ]; then
        error "DATABASE_URL not found. Set it in .env or use Railway CLI"
        exit 1
    fi
fi

# Determine backup file
if [ "$1" == "latest" ]; then
    BACKUP_FILE=$(find "${BACKUP_DIR}" -name "railway_backup_*.sql.gz" -type f -printf "%T@ %p\n" 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2)
    if [ -z "${BACKUP_FILE}" ]; then
        error "No backups found in ${BACKUP_DIR}"
        exit 1
    fi
    log "Using latest backup: $(basename "${BACKUP_FILE}")"
else
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

# Verify backup file
if [ ! -f "${BACKUP_FILE}" ]; then
    error "Backup file does not exist: ${BACKUP_FILE}"
    exit 1
fi

# Verify integrity
log "Verifying backup integrity..."
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    if ! gzip -t "${BACKUP_FILE}" 2>/dev/null; then
        error "Backup file is corrupted"
        exit 1
    fi
fi
log "Backup file integrity verified"

# Display restore information
log "Restore Information:"
log "  Backup file: $(basename "${BACKUP_FILE}")"
log "  Backup size: $(du -h "${BACKUP_FILE}" | cut -f1)"
log "  Target: Railway PostgreSQL Database"
echo ""

warn "WARNING: This will REPLACE ALL DATA in the Railway database!"
warn "Make sure you have a recent backup before proceeding."
echo ""
read -p "Type 'RESTORE' to confirm: " -r
echo ""

if [[ ! $REPLY == "RESTORE" ]]; then
    log "Restore cancelled by user"
    exit 0
fi

# Create safety backup first
SAFETY_BACKUP="${BACKUP_DIR}/pre_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
log "Creating safety backup of current database..."
if pg_dump "${DATABASE_URL}" 2>/dev/null | gzip > "${SAFETY_BACKUP}"; then
    log "Safety backup created: $(basename "${SAFETY_BACKUP}")"
else
    warn "Failed to create safety backup"
    read -p "Continue without safety backup? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log "Restore cancelled"
        exit 0
    fi
fi

# Restore from backup
log "Restoring database from backup..."
log "This may take several minutes..."

if [[ "${BACKUP_FILE}" == *.gz ]]; then
    if gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}" > /dev/null 2>&1; then
        log "Database restored successfully"
    else
        error "Restore failed"
        if [ -f "${SAFETY_BACKUP}" ]; then
            warn "Rolling back to safety backup..."
            gunzip -c "${SAFETY_BACKUP}" | psql "${DATABASE_URL}" > /dev/null 2>&1
            error "Reverted to safety backup"
        fi
        exit 1
    fi
else
    if psql "${DATABASE_URL}" < "${BACKUP_FILE}" > /dev/null 2>&1; then
        log "Database restored successfully"
    else
        error "Restore failed"
        exit 1
    fi
fi

# Verify restore
log "Verifying restored database..."
URL_COUNT=$(psql "${DATABASE_URL}" -t -c "SELECT COUNT(*) FROM urls;" 2>/dev/null | tr -d ' ' || echo "0")
log "Restored database contains ${URL_COUNT} URLs"

log "Restore completed successfully!"
echo ""
log "Safety backup preserved at: $(basename "${SAFETY_BACKUP}")"

exit 0
