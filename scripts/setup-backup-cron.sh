#!/bin/bash

###############################################################################
# Setup Automated Database Backups (Cron Job)
#
# This script helps you set up a cron job to automatically backup the database
#
# Usage:
#   sudo ./scripts/setup-backup-cron.sh
#
# What it does:
#   1. Creates a backup configuration file in /etc/budget-bot/
#   2. Sets up a cron job to run backups daily at 2:00 AM
#   3. Creates necessary directories with proper permissions
#   4. Tests the backup process
#
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "BudgetBot - Setup Automated Backups"
echo "=========================================="
echo ""

# ===== Check if running as root =====
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ This script must be run as root (use sudo)${NC}"
  echo "   sudo ./scripts/setup-backup-cron.sh"
  exit 1
fi

# ===== Get script directory =====
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${GREEN}✓${NC} Project directory: $PROJECT_DIR"
echo ""

# ===== Get user input =====
echo "Please provide the following information:"
echo ""

# Database URL
read -p "Database URL (e.g., postgresql://user:pass@host:5432/db): " DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL is required${NC}"
  exit 1
fi

# Backup directory
read -p "Backup directory (default: /var/backups/budget-bot): " BACKUP_DIR
BACKUP_DIR=${BACKUP_DIR:-/var/backups/budget-bot}

# Retention days
read -p "Retention period in days (default: 7): " RETENTION_DAYS
RETENTION_DAYS=${RETENTION_DAYS:-7}

# Backup time
read -p "Backup time (HH:MM, default: 02:00): " BACKUP_TIME
BACKUP_TIME=${BACKUP_TIME:-02:00}

# Parse backup time
HOUR=$(echo "$BACKUP_TIME" | cut -d: -f1)
MINUTE=$(echo "$BACKUP_TIME" | cut -d: -f2)

echo ""
echo "=========================================="
echo "Configuration Summary"
echo "=========================================="
echo "Backup directory: $BACKUP_DIR"
echo "Retention period: $RETENTION_DAYS days"
echo "Backup time: $BACKUP_TIME (${HOUR}:${MINUTE})"
echo ""

read -p "Proceed with setup? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo -e "${YELLOW}⚠ Setup cancelled${NC}"
  exit 0
fi

echo ""
echo "=========================================="
echo "Setting up automated backups..."
echo "=========================================="
echo ""

# ===== Create configuration directory =====
echo "1. Creating configuration directory..."
mkdir -p /etc/budget-bot
chmod 700 /etc/budget-bot
echo -e "   ${GREEN}✓${NC} /etc/budget-bot created"

# ===== Create configuration file =====
echo "2. Creating configuration file..."
cat > /etc/budget-bot/backup.conf <<EOF
# BudgetBot Backup Configuration
# This file contains sensitive credentials - keep it secure!

DATABASE_URL="$DATABASE_URL"
BACKUP_DIR="$BACKUP_DIR"
RETENTION_DAYS="$RETENTION_DAYS"
PROJECT_DIR="$PROJECT_DIR"
EOF

chmod 600 /etc/budget-bot/backup.conf
echo -e "   ${GREEN}✓${NC} /etc/budget-bot/backup.conf created (chmod 600)"

# ===== Create backup directory =====
echo "3. Creating backup directory..."
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
echo -e "   ${GREEN}✓${NC} $BACKUP_DIR created (chmod 700)"

# ===== Create log directory =====
echo "4. Creating log directory..."
mkdir -p /var/log/budget-bot
chmod 755 /var/log/budget-bot
echo -e "   ${GREEN}✓${NC} /var/log/budget-bot created"

# ===== Create backup wrapper script =====
echo "5. Creating backup wrapper script..."
cat > /usr/local/bin/budget-bot-backup <<'EOF'
#!/bin/bash
set -euo pipefail

# Load configuration
if [ ! -f /etc/budget-bot/backup.conf ]; then
  echo "❌ ERROR: /etc/budget-bot/backup.conf not found"
  exit 1
fi

source /etc/budget-bot/backup.conf

# Run backup
cd "$PROJECT_DIR"
"$PROJECT_DIR/scripts/backup-db.sh" "$BACKUP_DIR" "$RETENTION_DAYS"
EOF

chmod 755 /usr/local/bin/budget-bot-backup
echo -e "   ${GREEN}✓${NC} /usr/local/bin/budget-bot-backup created"

# ===== Test backup script =====
echo "6. Testing backup script..."
if /usr/local/bin/budget-bot-backup; then
  echo -e "   ${GREEN}✓${NC} Backup test successful!"
else
  echo -e "   ${RED}❌ Backup test failed${NC}"
  echo "   Check logs and configuration"
  exit 1
fi

# ===== Setup cron job =====
echo "7. Setting up cron job..."

# Create cron job entry
CRON_ENTRY="$MINUTE $HOUR * * * /usr/local/bin/budget-bot-backup >> /var/log/budget-bot/backup.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "budget-bot-backup"; then
  echo -e "   ${YELLOW}⚠ Cron job already exists, removing old entry...${NC}"
  crontab -l | grep -v "budget-bot-backup" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
echo -e "   ${GREEN}✓${NC} Cron job added (runs daily at $BACKUP_TIME)"

# ===== Setup log rotation =====
echo "8. Setting up log rotation..."
cat > /etc/logrotate.d/budget-bot-backup <<EOF
/var/log/budget-bot/backup.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF

echo -e "   ${GREEN}✓${NC} Log rotation configured (30 days)"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  • Backups will run daily at $BACKUP_TIME"
echo "  • Backup location: $BACKUP_DIR"
echo "  • Retention period: $RETENTION_DAYS days"
echo "  • Logs: /var/log/budget-bot/backup.log"
echo ""
echo "Useful commands:"
echo "  • Manual backup:  /usr/local/bin/budget-bot-backup"
echo "  • View logs:      tail -f /var/log/budget-bot/backup.log"
echo "  • List backups:   ls -lh $BACKUP_DIR"
echo "  • Edit cron:      crontab -e"
echo ""
echo "Next steps:"
echo "  1. Test restore process (see docs/backup-and-restore.md)"
echo "  2. Set up monitoring alerts for backup failures"
echo "  3. Consider off-site backup storage (S3, etc.)"
echo ""
