# 🚀 Deployment Checklist - API Key Encryption

## ✅ Pre-Deployment Checklist

Before deploying the encrypted API keys feature to production, complete these steps:

### 1. Generate Encryption Key
```bash
# Generate a strong 32-byte encryption key
openssl rand -base64 32

# Example output:
# kX8hF3mN9pQ2rT5wY7zA1bC4dE6fG8hJ0kL2mN4pQ6r=
```

- [ ] Generated ENCRYPTION_KEY
- [ ] Saved key to secure location (password manager, secrets vault)
- [ ] **NEVER** commit key to git

### 2. Environment Setup
```bash
# Add to .env (development)
echo "ENCRYPTION_KEY=<your-generated-key>" >> .env

# For production, add to your hosting platform:
# - Heroku: heroku config:set ENCRYPTION_KEY=<key>
# - Vercel: Environment Variables in dashboard
# - Docker: Pass as environment variable
# - AWS/GCP: Secrets Manager
```

- [ ] Added ENCRYPTION_KEY to development .env
- [ ] Added ENCRYPTION_KEY to staging environment
- [ ] Added ENCRYPTION_KEY to production environment
- [ ] Verified key is exactly 44 characters (base64 encoded 32 bytes)

### 3. Database Migration
```bash
# Step 1: Add new encrypted columns
psql $DATABASE_URL -f server/migrations/0001-add-encrypted-api-keys.sql

# Step 2: Verify columns were added
psql $DATABASE_URL -c "\d settings"
# Should show: anthropic_api_key_encrypted, openai_api_key_encrypted
```

- [ ] SQL migration completed on development
- [ ] SQL migration completed on staging
- [ ] SQL migration completed on production
- [ ] Verified new columns exist

### 4. Data Migration (if you have existing users)
```bash
# Migrate existing unencrypted API keys to encrypted format
ENCRYPTION_KEY=<your-key> DATABASE_URL=<url> tsx server/migrations/migrate-encrypt-keys.ts

# Expected output:
# 🔐 Starting API key encryption migration...
# Found X users with API keys to migrate
# ✅ Migrated: X
# 🎉 Migration completed successfully!
```

- [ ] Backed up database before migration
- [ ] Ran migration on development (verified)
- [ ] Ran migration on staging (verified)
- [ ] Ran migration on production (verified)
- [ ] All users' keys migrated successfully (0 errors)

### 5. Testing
```bash
# Test encryption functionality
node test-encryption.mjs

# Expected output:
# 🎉 All manual tests passed!
```

- [ ] Encryption tests pass locally
- [ ] Tested AI features with encrypted keys (development)
- [ ] Tested OCR features with encrypted keys (development)
- [ ] Tested voice transcription with encrypted keys (development)
- [ ] Verified decryption works correctly
- [ ] No errors in application logs

### 6. Deployment
```bash
# Build the application
npm run build

# Start in production mode
npm start
```

- [ ] Application builds successfully
- [ ] Application starts without errors
- [ ] No "ENCRYPTION_KEY not found" errors in logs
- [ ] Users can save new API keys
- [ ] Users can use AI features
- [ ] Users can use OCR features
- [ ] Users can use voice features

### 7. Monitoring (First 48 Hours)
- [ ] Monitor error logs for decryption failures
- [ ] Check that new API keys are being encrypted
- [ ] Verify old users with legacy keys still work
- [ ] No complaints from users about API key issues

### 8. Cleanup (After 1-2 Weeks)
Once you've confirmed everything works:

```sql
-- Remove legacy unencrypted columns
ALTER TABLE settings DROP COLUMN anthropic_api_key;
ALTER TABLE settings DROP COLUMN openai_api_key;
```

- [ ] Monitored for 1-2 weeks with no issues
- [ ] Removed legacy columns from database
- [ ] Updated schema.ts to remove deprecated fields
- [ ] Deployed cleanup changes

---

## 🔒 Security Verification

### ENCRYPTION_KEY Security
- [ ] ✅ Key is 32 bytes (44 chars in base64)
- [ ] ✅ Key generated with `openssl rand -base64 32`
- [ ] ✅ Key stored in secrets manager (not in code)
- [ ] ✅ Key NOT committed to git
- [ ] ✅ Different keys for dev/staging/production
- [ ] ✅ Key backed up securely

### Database Security
- [ ] ✅ Encrypted columns contain data (not null)
- [ ] ✅ No plain-text keys in encrypted columns
- [ ] ✅ Legacy columns cleared after migration
- [ ] ✅ Database backups encrypted

### Application Security
- [ ] ✅ No API keys logged in plain text
- [ ] ✅ Decryption errors logged (without exposing keys)
- [ ] ✅ HTTPS enabled in production
- [ ] ✅ Session security configured

---

## 🚨 Rollback Plan

If something goes wrong, follow this rollback procedure:

### Quick Rollback (Same encryption key)
1. Revert code changes
2. Redeploy previous version
3. Legacy fields still have data (backward compatible)

### Full Rollback (If encryption key lost)
```sql
-- Emergency: Copy encrypted data to legacy fields AS-IS
-- (Users will need to re-enter keys)
UPDATE settings SET
  anthropic_api_key = NULL,
  openai_api_key = NULL
WHERE anthropic_api_key_encrypted IS NOT NULL
   OR openai_api_key_encrypted IS NOT NULL;

-- Notify users to re-enter API keys
```

- [ ] Database backup available
- [ ] Rollback procedure tested in staging
- [ ] Team knows rollback steps

---

## 📊 Success Metrics

After deployment, verify:

- ✅ **0 decryption errors** in logs
- ✅ **100% of API keys** migrated successfully
- ✅ **0 user complaints** about AI features
- ✅ **All tests pass** in production
- ✅ **Security audit** complete (no plain-text keys in DB)

---

## 🆘 Troubleshooting

### Users can't use AI features
1. Check application logs for decryption errors
2. Verify ENCRYPTION_KEY is set correctly
3. Check database for encrypted data
4. Test decryption manually with user's data

### "ENCRYPTION_KEY not found" error
1. Verify environment variable is set
2. Check variable name (exactly `ENCRYPTION_KEY`)
3. Restart application after setting variable

### "Decryption failed" error
1. Verify ENCRYPTION_KEY hasn't changed
2. Check database data format (`iv:authTag:encrypted`)
3. Verify no data corruption
4. Check application logs for stack trace

### New keys not saving
1. Check application logs for encryption errors
2. Verify ENCRYPTION_KEY is valid (32 bytes)
3. Test encryption manually
4. Check database permissions

---

## ✅ Final Checklist

Before marking this feature as complete:

- [ ] All items above checked
- [ ] Production deployment successful
- [ ] Users verified API features work
- [ ] No errors in production logs
- [ ] Security team reviewed (if applicable)
- [ ] Documentation updated
- [ ] Team trained on new encryption system

---

## 📞 Support

If you encounter issues during deployment:

1. Check logs first (`/var/log/app.log` or hosting platform logs)
2. Review `ENCRYPTION_SETUP.md` for detailed guidance
3. Test encryption manually with `test-encryption.mjs`
4. Verify database migration completed successfully
5. Check that ENCRYPTION_KEY is set correctly

**Emergency Contact:** [Your support channel]

---

## 🎉 Success!

Once all items are checked, your API keys are now encrypted with military-grade AES-256-GCM encryption!

**Security improved by 1000%!** 🔐
