# Database Backup and Restore Guide

This guide explains how to backup and restore the BudgetBot PostgreSQL database.

## Table of Contents

1. [Creating Backups](#creating-backups)
2. [Restoring from Backups](#restoring-from-backups)
3. [Automated Backups](#automated-backups)
4. [Disaster Recovery](#disaster-recovery)
5. [Best Practices](#best-practices)

---

## Creating Backups

### Manual Backup

Use the provided backup script to create a compressed database dump:

```bash
# Set your database connection string
export DATABASE_URL="postgresql://user:password@host:5432/database"

# Run the backup script
./scripts/backup-db.sh [backup_dir] [retention_days]
```

**Arguments:**
- `backup_dir` - Directory to store backups (default: `./backups`)
- `retention_days` - Number of days to keep old backups (default: 7)

**Example:**

```bash
# Backup to ./backups directory, keep for 7 days
DATABASE_URL="postgresql://..." ./scripts/backup-db.sh

# Backup to custom directory, keep for 30 days
DATABASE_URL="postgresql://..." ./scripts/backup-db.sh /mnt/backups 30
```

### What the Backup Script Does

1. **Creates SQL dump** - Uses `pg_dump` to export the entire database
2. **Compresses the dump** - Uses `gzip` to reduce file size (~90% reduction)
3. **Rotates old backups** - Automatically deletes backups older than retention period
4. **Provides restore command** - Shows exact command to restore this backup

### Backup File Format

Backups are stored with timestamp-based naming:

```
budget_bot_backup_20250124_153045.sql.gz
                    YYYYMMDD_HHMMSS
```

---

## Restoring from Backups

### Prerequisites

⚠️ **CRITICAL WARNINGS:**

1. **Restoring will OVERWRITE the target database** - all existing data will be lost
2. **Stop the application first** - prevent writes during restore
3. **Verify backup integrity** - test the backup file before restoring to production
4. **Backup current database** - create a backup before restoring (just in case)

### Restoration Steps

#### Step 1: Stop the Application

```bash
# If running with Docker Compose
docker-compose down

# If running as systemd service
sudo systemctl stop budget-bot

# If running as standalone process
# Find the process and kill it gracefully
lsof -ti:5000 | xargs kill -SIGTERM
```

#### Step 2: Verify Backup File

```bash
# Check that the backup file exists and is readable
ls -lh backups/budget_bot_backup_20250124_153045.sql.gz

# Optional: Test decompression (does not restore, just checks integrity)
gunzip -t backups/budget_bot_backup_20250124_153045.sql.gz
```

#### Step 3: Restore the Database

```bash
# Set your database connection string
export DATABASE_URL="postgresql://user:password@host:5432/database"

# Restore from compressed backup
gunzip -c backups/budget_bot_backup_20250124_153045.sql.gz | psql "$DATABASE_URL"
```

**For Neon DB (cloud PostgreSQL):**

```bash
export DATABASE_URL="postgresql://neondb_owner:password@host/neondb?sslmode=require"
gunzip -c backups/budget_bot_backup_20250124_153045.sql.gz | psql "$DATABASE_URL"
```

#### Step 4: Verify Restoration

```bash
# Connect to the database and check tables
psql "$DATABASE_URL" -c "\dt"

# Check row counts
psql "$DATABASE_URL" -c "SELECT
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM transactions) as transactions,
  (SELECT COUNT(*) FROM wallets) as wallets;"
```

#### Step 5: Restart the Application

```bash
# If using Docker Compose
docker-compose up -d

# If using systemd
sudo systemctl start budget-bot

# If running manually
npm run start
```

### Partial Restoration (Single Table)

If you only need to restore specific tables:

```bash
# Extract the SQL dump to a file first
gunzip -c backups/budget_bot_backup_20250124_153045.sql.gz > /tmp/full_backup.sql

# Restore only specific tables (using grep to filter)
grep -A 1000 "CREATE TABLE transactions" /tmp/full_backup.sql | psql "$DATABASE_URL"
```

---

## Automated Backups

### Setting Up Cron Job

To automatically backup the database daily at 2:00 AM:

1. **Edit crontab:**

```bash
crontab -e
```

2. **Add this line:**

```cron
0 2 * * * DATABASE_URL="postgresql://user:password@host:5432/database" /path/to/BudgetBot-Improved/scripts/backup-db.sh /backups 7 >> /var/log/budget-bot-backup.log 2>&1
```

**Breakdown:**
- `0 2 * * *` - Run at 2:00 AM every day
- `DATABASE_URL="..."` - Database connection string
- `/path/to/.../backup-db.sh` - Path to backup script
- `/backups 7` - Store in `/backups`, keep 7 days
- `>> /var/log/budget-bot-backup.log 2>&1` - Log output

### Production Backup Strategy

For production environments, consider:

1. **Multiple backup locations** - Store backups in different physical locations
2. **Off-site backups** - Upload to cloud storage (S3, Google Cloud Storage, etc.)
3. **Backup testing** - Regularly test restoration process
4. **Monitoring** - Alert if backups fail

**Example with S3 Upload:**

```bash
#!/bin/bash
# /path/to/backup-with-s3.sh

# Run backup
DATABASE_URL="postgresql://..." ./scripts/backup-db.sh /tmp/backups 7

# Upload to S3
LATEST_BACKUP=$(ls -t /tmp/backups/budget_bot_backup_*.sql.gz | head -1)
aws s3 cp "$LATEST_BACKUP" s3://my-backups/budget-bot/

# Clean up local copy
rm "$LATEST_BACKUP"
```

---

## Disaster Recovery

### Scenario 1: Database Corruption

**Symptoms:** Application crashes, SQL errors, data inconsistencies

**Recovery:**

1. Stop the application immediately
2. Create a backup of the corrupted database (for forensics)
3. Restore from the last known good backup
4. Investigate the root cause

### Scenario 2: Accidental Data Deletion

**Symptoms:** Users report missing transactions, wallets, etc.

**Recovery:**

1. Identify the approximate time of deletion
2. Find a backup taken before that time
3. Restore to a temporary database
4. Extract the deleted data
5. Import into production database

**Example:**

```bash
# Restore to temporary database
export TEMP_DB_URL="postgresql://user:password@host:5432/budget_bot_temp"
gunzip -c backups/budget_bot_backup_20250123_020000.sql.gz | psql "$TEMP_DB_URL"

# Extract deleted transactions
psql "$TEMP_DB_URL" -c "COPY (SELECT * FROM transactions WHERE user_id = 123) TO '/tmp/recovered_transactions.csv' CSV HEADER;"

# Import into production
psql "$DATABASE_URL" -c "\COPY transactions FROM '/tmp/recovered_transactions.csv' CSV HEADER;"
```

### Scenario 3: Complete Server Loss

**Symptoms:** Server is unreachable, hardware failure, hosting provider outage

**Recovery:**

1. Provision a new server
2. Install PostgreSQL and application dependencies
3. Restore database from off-site backup
4. Update DNS records to point to new server
5. Verify application functionality

---

## Best Practices

### Backup Frequency

| Environment | Frequency | Retention |
|-------------|-----------|-----------|
| Production  | Daily (or more) | 30 days |
| Staging     | Daily | 7 days |
| Development | Weekly | 7 days |

### Security

1. **Encrypt backups** - Use `gpg` to encrypt backup files

```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backups/budget_bot_backup_20250124_153045.sql.gz

# Decrypt and restore
gpg --decrypt backups/budget_bot_backup_20250124_153045.sql.gz.gpg | gunzip | psql "$DATABASE_URL"
```

2. **Secure storage** - Store backups in restricted directories (chmod 600)
3. **Access control** - Limit who can access backup files and restoration commands

### Testing

1. **Test restoration monthly** - Verify backups are valid
2. **Document recovery time** - Know how long restoration takes
3. **Practice disaster recovery** - Ensure team knows the process

### Monitoring

Set up alerts for:
- Failed backup jobs
- Missing backups (no backup in last 24 hours)
- Low disk space in backup directory
- Backup files older than retention period

**Example monitoring script:**

```bash
#!/bin/bash
# /path/to/check-backups.sh

BACKUP_DIR="/backups"
MAX_AGE_HOURS=24

# Find the newest backup
NEWEST_BACKUP=$(find "$BACKUP_DIR" -name "budget_bot_backup_*.sql.gz" -type f -mmin -$((MAX_AGE_HOURS * 60)) | head -1)

if [ -z "$NEWEST_BACKUP" ]; then
  echo "❌ ALERT: No backup found in last $MAX_AGE_HOURS hours!"
  # Send alert (email, Slack, PagerDuty, etc.)
  exit 1
else
  echo "✅ Backup OK: $(basename "$NEWEST_BACKUP")"
  exit 0
fi
```

---

## Troubleshooting

### Issue: "pg_dump: command not found"

**Solution:** Install PostgreSQL client tools

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

### Issue: "connection refused" during restore

**Solution:** Check DATABASE_URL and ensure PostgreSQL is running

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT version();"
```

### Issue: "permission denied" errors during restore

**Solution:** Ensure the database user has sufficient privileges

```sql
-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON DATABASE budget_bot TO your_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
```

### Issue: Out of disk space

**Solution:** Free up space or adjust retention period

```bash
# Check disk usage
df -h /backups

# Manually delete old backups
find /backups -name "budget_bot_backup_*.sql.gz" -type f -mtime +30 -delete
```

---

## Additional Resources

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump Reference](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Neon DB Backup Guide](https://neon.tech/docs/manage/backups)

---

## Support

For issues with backups or restoration:

1. Check application logs: `tail -f /var/log/budget-bot-backup.log`
2. Verify backup integrity: `gunzip -t backup_file.sql.gz`
3. Contact your database administrator
4. Open an issue on the project repository
