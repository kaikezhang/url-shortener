#!/bin/bash

################################################################################
# Backup Setup Script for URL Shortener
#
# This script helps set up automated database backups using either
# cron or systemd timers.
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo ""
echo "========================================="
echo "  URL Shortener Backup Setup"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    warn "Running as root. This is required for system-wide installation."
else
    warn "Not running as root. Some installation steps may require sudo."
fi

# Detect init system
if command -v systemctl &> /dev/null; then
    INIT_SYSTEM="systemd"
    info "Detected systemd"
elif command -v crontab &> /dev/null; then
    INIT_SYSTEM="cron"
    info "Detected cron"
else
    error "No supported init system found (systemd or cron required)"
    exit 1
fi

# Ask user for backup configuration
echo ""
log "Backup Configuration"
echo ""

read -p "Backup directory [/var/backups/url-shortener]: " BACKUP_DIR
BACKUP_DIR=${BACKUP_DIR:-/var/backups/url-shortener}

read -p "Retention period in days [7]: " RETENTION_DAYS
RETENTION_DAYS=${RETENTION_DAYS:-7}

echo ""
log "Backup Schedule Options:"
echo "  1) Daily at 2:00 AM (recommended for most sites)"
echo "  2) Every 6 hours (recommended for high-traffic sites)"
echo "  3) Every 4 hours"
echo "  4) Hourly"
echo "  5) Custom"
echo ""
read -p "Select backup schedule [1]: " SCHEDULE_OPTION
SCHEDULE_OPTION=${SCHEDULE_OPTION:-1}

# Create backup directory
log "Creating backup directory: ${BACKUP_DIR}"
mkdir -p "${BACKUP_DIR}"
chmod 750 "${BACKUP_DIR}"

# Update .env file with backup settings
if [ -f "${PROJECT_ROOT}/.env" ]; then
    log "Updating .env file with backup configuration..."

    # Remove old backup settings if they exist
    sed -i.bak '/^BACKUP_DIR=/d' "${PROJECT_ROOT}/.env" 2>/dev/null || true
    sed -i.bak '/^BACKUP_RETENTION_DAYS=/d' "${PROJECT_ROOT}/.env" 2>/dev/null || true

    # Add new settings
    echo "" >> "${PROJECT_ROOT}/.env"
    echo "# Backup Configuration" >> "${PROJECT_ROOT}/.env"
    echo "BACKUP_DIR=${BACKUP_DIR}" >> "${PROJECT_ROOT}/.env"
    echo "BACKUP_RETENTION_DAYS=${RETENTION_DAYS}" >> "${PROJECT_ROOT}/.env"

    log ".env file updated"
else
    warn ".env file not found. Please create it and add BACKUP_DIR and BACKUP_RETENTION_DAYS"
fi

# Setup based on init system
if [ "$INIT_SYSTEM" = "systemd" ]; then
    log "Setting up systemd timer..."

    # Copy service and timer files
    SYSTEMD_DIR="/etc/systemd/system"

    # Update paths in service file
    sed "s|/path/to/url-shorter|${PROJECT_ROOT}|g" "${SCRIPT_DIR}/url-shortener-backup.service" > /tmp/url-shortener-backup.service

    # Update schedule in timer file based on selection
    case $SCHEDULE_OPTION in
        1) SCHEDULE="OnCalendar=02:00" ;;
        2) SCHEDULE="OnCalendar=00/6:00" ;;
        3) SCHEDULE="OnCalendar=00/4:00" ;;
        4) SCHEDULE="OnCalendar=hourly" ;;
        5)
            read -p "Enter custom systemd timer schedule (e.g., 'daily' or '00/6:00'): " CUSTOM_SCHEDULE
            SCHEDULE="OnCalendar=${CUSTOM_SCHEDULE}"
            ;;
    esac

    # Create timer file with selected schedule
    cat > /tmp/url-shortener-backup.timer <<EOF
[Unit]
Description=URL Shortener Database Backup Timer
Requires=url-shortener-backup.service

[Timer]
${SCHEDULE}
OnBootSec=5min
Persistent=true
RandomizedDelaySec=300

[Install]
WantedBy=timers.target
EOF

    if [ "$EUID" -eq 0 ]; then
        cp /tmp/url-shortener-backup.service "${SYSTEMD_DIR}/"
        cp /tmp/url-shortener-backup.timer "${SYSTEMD_DIR}/"

        systemctl daemon-reload
        systemctl enable url-shortener-backup.timer
        systemctl start url-shortener-backup.timer

        log "Systemd timer installed and started"

        # Show status
        systemctl status url-shortener-backup.timer --no-pager
    else
        warn "Root access required to install systemd units"
        info "Please run the following commands as root:"
        echo ""
        echo "  sudo cp /tmp/url-shortener-backup.service ${SYSTEMD_DIR}/"
        echo "  sudo cp /tmp/url-shortener-backup.timer ${SYSTEMD_DIR}/"
        echo "  sudo systemctl daemon-reload"
        echo "  sudo systemctl enable url-shortener-backup.timer"
        echo "  sudo systemctl start url-shortener-backup.timer"
    fi

elif [ "$INIT_SYSTEM" = "cron" ]; then
    log "Setting up cron job..."

    # Determine cron schedule
    case $SCHEDULE_OPTION in
        1) CRON_SCHEDULE="0 2 * * *" ;;
        2) CRON_SCHEDULE="0 */6 * * *" ;;
        3) CRON_SCHEDULE="0 */4 * * *" ;;
        4) CRON_SCHEDULE="0 * * * *" ;;
        5)
            read -p "Enter custom cron schedule (e.g., '0 2 * * *'): " CUSTOM_SCHEDULE
            CRON_SCHEDULE="${CUSTOM_SCHEDULE}"
            ;;
    esac

    CRON_ENTRY="${CRON_SCHEDULE} cd ${PROJECT_ROOT} && ${SCRIPT_DIR}/backup.sh >> /var/log/url-shortener-backup.log 2>&1"

    info "Cron entry to add:"
    echo ""
    echo "  ${CRON_ENTRY}"
    echo ""

    read -p "Add this cron job now? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        # Add to crontab
        (crontab -l 2>/dev/null || true; echo "${CRON_ENTRY}") | crontab -
        log "Cron job added"

        # Show current crontab
        log "Current crontab:"
        crontab -l | grep url-shortener || true
    else
        info "Cron job not added. You can add it manually with: crontab -e"
    fi
fi

# Test backup script
echo ""
read -p "Run a test backup now? (yes/no): " -r
if [[ $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    log "Running test backup..."
    "${SCRIPT_DIR}/backup.sh"

    # List backups
    log "Backups in ${BACKUP_DIR}:"
    ls -lh "${BACKUP_DIR}"
fi

echo ""
log "Setup complete!"
echo ""
log "Next steps:"
echo "  1. Verify backup configuration in .env"
echo "  2. Test restore procedure: ${SCRIPT_DIR}/restore.sh latest"
echo "  3. Monitor backup logs"
if [ "$INIT_SYSTEM" = "systemd" ]; then
    echo "  4. Check timer status: systemctl status url-shortener-backup.timer"
else
    echo "  4. Check cron logs: tail -f /var/log/url-shortener-backup.log"
fi

exit 0
