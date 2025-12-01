# 🧪 Session Persistence Testing Guide

## Overview
This guide helps you verify that sessions persist across server restarts.

---

## Manual Testing Steps

### 1. Start the Application
```bash
npm run dev
```

### 2. Login via Browser
1. Open browser: `http://localhost:5000`
2. Register or login
3. Verify you're logged in (can see dashboard)

### 3. Check Session in Database
```bash
# Connect to database
psql $DATABASE_URL

# Query sessions
SELECT sid, sess->>'passport' as user_data, expire
FROM session
ORDER BY expire DESC;

# Should show your session with user ID
```

Expected output:
```
       sid           | user_data |         expire
---------------------+-----------+------------------------
 abc123def456...     | {"user":1}| 2025-01-29 12:00:00
```

### 4. Restart Server
```bash
# Stop server (Ctrl+C in terminal)
# Start again
npm run dev
```

### 5. Verify Session Persisted
1. **Refresh browser** - you should still be logged in
2. No redirect to login page
3. Dashboard loads immediately

### 6. Check Session Still in DB
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM session;"

# Should show 1 (or more if multiple users)
```

---

## ✅ Success Criteria

- ✅ Session exists in database after login
- ✅ User remains logged in after server restart
- ✅ No login redirect after restart
- ✅ Session cookie persists in browser
- ✅ Session expiration works (check after 7 days)

---

## ❌ Failure Scenarios

### If you get logged out after restart:

**Possible causes:**
1. Session table not created (run migration)
2. SESSION_SECRET changed between restarts
3. Store not configured properly
4. Database connection issue

**Debugging:**
```bash
# 1. Check session table exists
psql $DATABASE_URL -c "\dt session"

# 2. Check sessions in database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM session;"

# 3. Check SESSION_SECRET is set
echo $SESSION_SECRET

# 4. Check application logs for errors
# Look for "Session store error" messages
```

---

## Advanced Testing

### Test Session Expiration

```bash
# 1. Login
# 2. Manually set session to expire soon
psql $DATABASE_URL -c "
UPDATE session
SET expire = NOW() + INTERVAL '1 minute'
WHERE sid = '<your-session-id>';
"

# 3. Wait 1 minute
# 4. Refresh browser - should be logged out
```

### Test Concurrent Sessions

1. Login from Browser 1
2. Login from Browser 2 (different browser/incognito)
3. Both should have separate sessions
4. Check database:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM session;"
# Should show 2
```

### Test Session Cleanup

```bash
# 1. Create expired session manually
psql $DATABASE_URL -c "
INSERT INTO session (sid, sess, expire)
VALUES (
  'test-expired-session',
  '{\"cookie\":{}}',
  NOW() - INTERVAL '1 day'
);
"

# 2. Wait 15 minutes (pruneSessionInterval)
# 3. Check if expired session was cleaned up
psql $DATABASE_URL -c "
SELECT sid FROM session
WHERE sid = 'test-expired-session';
"
# Should return 0 rows
```

---

## Performance Testing

### Check Session Load Time

```bash
# Time how long it takes to load session
psql $DATABASE_URL -c "
EXPLAIN ANALYZE
SELECT sess FROM session
WHERE sid = '<your-session-id>';
"

# Should be < 1ms with index on sid
```

### Stress Test (Optional)

```bash
# Create 1000 fake sessions
psql $DATABASE_URL -c "
INSERT INTO session (sid, sess, expire)
SELECT
  'stress-test-' || generate_series,
  '{\"cookie\":{}}',
  NOW() + INTERVAL '7 days'
FROM generate_series(1, 1000);
"

# Test query performance
psql $DATABASE_URL -c "
EXPLAIN ANALYZE
SELECT sess FROM session
WHERE sid = 'stress-test-500';
"

# Cleanup
psql $DATABASE_URL -c "
DELETE FROM session WHERE sid LIKE 'stress-test-%';
"
```

---

## 🔍 Monitoring

### Check Session Count
```bash
psql $DATABASE_URL -c "
SELECT COUNT(*) as total_sessions FROM session;
"
```

### Check Expired Sessions
```bash
psql $DATABASE_URL -c "
SELECT COUNT(*) as expired_sessions
FROM session
WHERE expire < NOW();
"
```

### Check Active Sessions
```bash
psql $DATABASE_URL -c "
SELECT COUNT(*) as active_sessions
FROM session
WHERE expire > NOW();
"
```

### Session Statistics
```bash
psql $DATABASE_URL -c "
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN expire > NOW() THEN 1 END) as active,
  COUNT(CASE WHEN expire < NOW() THEN 1 END) as expired,
  MIN(expire) as oldest_expire,
  MAX(expire) as newest_expire
FROM session;
"
```

---

## 🐛 Troubleshooting

### Error: "relation \"session\" does not exist"
```bash
# Run migration
psql $DATABASE_URL -f server/migrations/0002-create-session-table.sql
```

### Error: "SESSION_SECRET environment variable is required"
```bash
# Generate and set secret
openssl rand -base64 32 >> .env
# Format: SESSION_SECRET=<generated-value>
```

### Sessions not cleaning up
- Check `pruneSessionInterval` is set (default: 15 min)
- Check database permissions
- Verify expired sessions exist:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM session WHERE expire < NOW();"
```

### Session data corrupted
```bash
# Check session data format
psql $DATABASE_URL -c "SELECT sid, sess FROM session LIMIT 1;"

# Should be valid JSON with structure:
# {"cookie": {...}, "passport": {"user": 1}}
```

---

## ✅ Final Checklist

After testing, verify:

- [ ] ✅ Session table created in database
- [ ] ✅ Sessions persist after server restart
- [ ] ✅ Users remain logged in after restart
- [ ] ✅ Expired sessions are cleaned up automatically
- [ ] ✅ Multiple users can have concurrent sessions
- [ ] ✅ Session expiration works correctly (7 days)
- [ ] ✅ No errors in application logs
- [ ] ✅ Performance is acceptable (< 1ms query time)

---

## 📊 Expected Results

### Before (MemoryStore)
- ❌ Sessions lost on restart
- ❌ All users logged out on deploy
- ❌ No session persistence
- ❌ Poor user experience

### After (PostgreSQL Store)
- ✅ Sessions persist across restarts
- ✅ Users stay logged in
- ✅ Zero downtime deploys
- ✅ Better user experience
- ✅ Session analytics possible

---

**Session persistence working?** ✅ You're done! Move to next task.

**Still having issues?** Check troubleshooting section above.
