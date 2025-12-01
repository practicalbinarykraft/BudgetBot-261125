#!/bin/bash

###############################################################################
# Database Backup Script
#
# This script creates compressed backups of the PostgreSQL database
# and manages backup rotation (keeps last N backups)
#
# Usage:
#   ./scripts/backup-db.sh [backup_dir] [retention_days]
#
# Arguments:
#   backup_dir      - Directory to store backups (default: ./backups)
#   retention_days  - Number of days to keep backups (default: 7)
#
# Environment Variables:
#   DATABASE_URL    - PostgreSQL connection string (required)
#
# Example:
#   DATABASE_URL="postgres://user:pass@host:5432/dbname" ./scripts/backup-db.sh
###############################################################################

set -euo pipefail  # Exit on error, undefined variable, or pipe failure

# ===== Configuration =====
BACKUP_DIR="${1:-./backups}"
RETENTION_DAYS="${2:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="budget_bot_backup_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

# ===== Validate Environment =====
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is required"
  echo "Usage: DATABASE_URL='postgres://...' ./scripts/backup-db.sh"
  exit 1
fi

# ===== Create Backup Directory =====
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting database backup..."
echo "   Timestamp: $TIMESTAMP"
echo "   Backup dir: $BACKUP_DIR"
echo "   Retention: $RETENTION_DAYS days"
echo ""

# ===== Perform Backup =====
echo "📦 Creating backup..."
if pg_dump "$DATABASE_URL" > "$BACKUP_DIR/$BACKUP_FILE"; then
  echo "✅ Backup created: $BACKUP_FILE"
else
  echo "❌ Backup failed!"
  exit 1
fi

# ===== Compress Backup =====
echo "🗜️  Compressing backup..."
if gzip "$BACKUP_DIR/$BACKUP_FILE"; then
  COMPRESSED_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE_GZ" | cut -f1)
  echo "✅ Backup compressed: $BACKUP_FILE_GZ ($COMPRESSED_SIZE)"
else
  echo "❌ Compression failed!"
  exit 1
fi

# ===== Rotate Old Backups =====
echo "🔄 Rotating old backups (keeping last $RETENTION_DAYS days)..."
DELETED_COUNT=0
while IFS= read -r old_backup; do
  rm -f "$old_backup"
  DELETED_COUNT=$((DELETED_COUNT + 1))
  echo "   🗑️  Deleted: $(basename "$old_backup")"
done < <(find "$BACKUP_DIR" -name "budget_bot_backup_*.sql.gz" -type f -mtime +"$RETENTION_DAYS")

if [ "$DELETED_COUNT" -eq 0 ]; then
  echo "   ℹ️  No old backups to delete"
fi

# ===== Summary =====
echo ""
echo "✅ Backup completed successfully!"
echo ""
echo "📊 Backup Summary:"
echo "   File: $BACKUP_DIR/$BACKUP_FILE_GZ"
echo "   Size: $COMPRESSED_SIZE"
echo "   Deleted old backups: $DELETED_COUNT"
echo ""
echo "🔐 To restore this backup, run:"
echo "   gunzip -c $BACKUP_DIR/$BACKUP_FILE_GZ | psql \"\$DATABASE_URL\""
echo ""
