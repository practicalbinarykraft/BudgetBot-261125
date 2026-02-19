# Codebase Concerns

**Analysis Date:** 2026-02-19

## Tech Debt

**Excessive Debug Logging in Admin Services:**
- Issue: `server/services/admin-users.service.ts` contains 10+ consecutive debug log statements (lines 220-357) that were likely added during debugging but never cleaned up
- Files: `server/services/admin-users.service.ts` (lines 220-357)
- Impact: Produces verbose debug output in logs even at info level, making actual issues harder to find. Each `getUserDetails()` call logs 12+ messages.
- Fix approach: Remove debug logs or consolidate into single summary log. Keep only `logError()` for actual errors.

**Type Safety Issues (any types):**
- Issue: Middleware authentication files use `any` types extensively for Express handlers instead of properly typing generics
- Files:
  - `server/middleware/auth-utils.ts` (lines 7-11, 43, 55)
  - `server/middleware/mobile-auth.ts` (lines 25-29, 43, 51, 55, 58, 60, 67)
  - Multiple test files with `(req as any)`, `(result as any)` casts
- Impact: Reduces type safety benefits of TypeScript, makes refactoring risky
- Fix approach: Properly type Express middleware using generic parameters instead of casting to `any`

**Large Service Files:**
- Issue: Several service files exceed 500+ lines, violating the stated junior-friendly pattern of <150 LOC per file
- Files:
  - `server/services/admin-metrics.service.ts` (772 lines)
  - `server/services/admin-users.service.ts` (570 lines)
  - `server/services/trend-calculator.service.ts` (551 lines)
  - `server/routes/auth-telegram.routes.ts` (601 lines)
  - `server/routes/transactions.routes.ts` (552 lines)
- Impact: Makes code harder to understand, test, and maintain. Violates stated architectural guidelines.
- Fix approach: Split large files into smaller, focused modules. Examples: split `admin-metrics.service.ts` into `hero-metrics.service.ts`, `user-metrics.service.ts`, etc.

**Unimplemented Features Marked TODO:**
- Issue: Multiple TODOs across codebase indicating incomplete functionality
- Files with incomplete implementations:
  - `server/services/price-search.service.ts` (line 47): "TODO: В Stage 7 добавим реальный AI поиск цен" (real AI price search not implemented)
  - `server/services/product-catalog.service.ts` (line 147): "TODO: Добавить AI категоризацию позже" (AI categorization stub)
  - `server/services/password-recovery.service.ts` (line 200): "TODO: Implement email sending when email service is added"
  - `server/services/admin-system-health.service.ts` (lines 336, 354): "TODO" for 24-hour request counting and CPU usage calculation
  - `server/telegram/menu/keyboards.ts` (line 136): "TODO: Replace with callback_data instead of emoji text for i18n compatibility"
  - `server/telegram/menu/settings-handler.ts` (line 124): "TODO: Load currency list from config instead of hardcoding"
  - `server/telegram/menu/ai-chat-handler.ts` (line 269): "TODO: Filter by role='user' to prevent assistant responses from extending session"
- Impact: Features partially working or missing in production, accumulating technical debt
- Fix approach: Create issues for each TODO. Prioritize based on user impact. Complete before marking feature as stable.

**Circular Dependency Risk:**
- Issue: `server/lib/env.ts` (line 16) has TODO noting potential circular dependency with logger
- Files: `server/lib/env.ts`
- Impact: Fragile dependency graph makes refactoring risky, env validation cannot use logger
- Fix approach: Extract env validation into separate module without logger dependency

**Incomplete Stub Returns:**
- Issue: Multiple functions return `null`, `[]`, or `{}` without clear error context
- Files:
  - `server/services/transaction.service.ts` (returns null for missing transaction)
  - `server/services/api-key-manager.ts` (returns null for missing key)
  - `server/services/admin-users.service.ts` (returns null for missing user)
- Impact: Callers cannot distinguish between "not found" and "error" states, leads to silent failures
- Fix approach: Use Result types or throw specific errors instead of returning null

---

## Known Bugs

**Admin User Details Credits Calculation:**
- Symptoms: `getUserDetails()` has defensive code (lines 287-319) suggesting credits balance calculation sometimes fails
- Files: `server/services/admin-users.service.ts` (lines 287-319)
- Trigger: Unclear from code - defensive try/catch wraps `getCreditBalance()` and falls back to zero values
- Workaround: Currently falls back to `{ totalGranted: 0, totalUsed: 0, messagesRemaining: 0 }` silently
- Fix approach: Investigate why `getCreditBalance()` might fail. Add specific error logging before swallowing exception.

**Telegram Bot Message Sending May Fail Silently:**
- Symptoms: `password-recovery.service.ts` returns false if Telegram bot not initialized (line 103)
- Files: `server/services/password-recovery.service.ts` (lines 95-115)
- Trigger: Telegram bot not started (e.g., `TELEGRAM_BOT_TOKEN` not set)
- Workaround: Falls back to email, but email sending is not implemented (see TODO on line 200)
- Fix approach: Implement email sending or ensure Telegram bot is always available. Add metrics for fallback usage.

**Missing Email Implementation:**
- Symptoms: Password recovery service cannot send recovery codes via email
- Files: `server/services/password-recovery.service.ts` (line 200)
- Trigger: User has no Telegram linked and requests password reset
- Workaround: No workaround - recovery fails
- Fix approach: Integrate email service (SendGrid, AWS SES, etc.). Currently blocking if Telegram not linked.

---

## Security Considerations

**CORS Configuration Incomplete:**
- Risk: CORS allows all HTTP localhost origins in development, including `localhost:5000` (server itself)
- Files: `server/middleware/cors.ts` (lines 15-21)
- Current mitigation: Development-only, but should be more selective
- Recommendations:
  - Separate dev CORS config from hardcoded origins
  - Never allow `localhost:5000` (API server itself) as origin - indicates misconfiguration
  - Use environment variable for CORS origins in development: `DEV_CORS_ORIGINS=localhost:3000,localhost:8081`

**JWT Token Expiry Too Long:**
- Risk: Mobile auth tokens expire in 30 days (`signMobileToken` on line 17 of `mobile-auth.ts`)
- Files: `server/middleware/mobile-auth.ts` (line 17)
- Current mitigation: None - long-lived tokens remain valid even if user password compromised
- Recommendations:
  - Reduce expiry to 7 days for mobile tokens
  - Implement refresh token pattern with shorter access token lifetime (1 hour)
  - Add token revocation mechanism for logout

**Type Casts Bypassing Type Checking:**
- Risk: Multiple `as any` casts in authentication middleware defeat TypeScript type safety
- Files:
  - `server/middleware/mobile-auth.ts` (lines 43, 51, 55, 58, 60, 67)
  - `server/middleware/auth-utils.ts` (line 43, 55)
- Current mitigation: Tests may not catch type errors
- Recommendations: Use proper generic typing instead of casts. This prevents accidental property mismatches that could leak data.

**API Key Stored in Process Memory:**
- Risk: `api-key-manager.ts` uses `getSystemKey()` which reads from environment on every call, but caching possible
- Files: `server/services/api-key-manager.ts`
- Current mitigation: Keys not explicitly cached, but environment variables remain in process.env
- Recommendations:
  - Consider using AWS Secrets Manager or HashiCorp Vault for production
  - Clear sensitive env vars after initialization if not needed throughout lifetime
  - Audit where API keys are logged

**Telegram Bot Token Exposed in Logs:**
- Risk: `auth-telegram.routes.ts` line 12-63 documents OAuth verification process but doesn't prevent token logging
- Files: `server/routes/auth-telegram.routes.ts`
- Current mitigation: Assuming logger filters sensitive data
- Recommendations:
  - Explicitly filter bot token and user auth data from logs
  - Add `logSensitive()` function that masks tokens: `sk-***...abc`
  - Review all logError() calls with user data

---

## Performance Bottlenecks

**No Pagination on Large Admin Queries:**
- Problem: `getUsersList()` fetches all user transactions/statistics in separate queries per user
- Files: `server/services/admin-users.service.ts` (lines 224-284)
- Cause: Makes 7 separate DB queries per user to get stats (count, income, expenses, wallets, categories, budgets, lastActive)
- Improvement path:
  - Use single aggregation query or CTE instead of 7 separate queries
  - Cache frequently accessed admin data
  - Add database indexes on `userId` and date columns

**Metrics In-Memory Cache Without Eviction Policy:**
- Problem: `admin-metrics.service.ts` uses simple Map for caching without size limits
- Files: `server/services/admin-metrics.service.ts` (lines 24-50)
- Cause: If metrics calculation runs frequently, cache could grow unbounded with stale entries
- Improvement path:
  - Use `node-cache` (already in dependencies) with size limits and eviction
  - Consider Redis for distributed caching
  - Add cache hit/miss metrics for monitoring

**Debug Logging Creates Excessive Database Load:**
- Problem: Each `getUserDetails()` call with debug enabled logs result JSON serialization multiple times
- Files: `server/services/admin-users.service.ts` (lines 348-357)
- Cause: `JSON.stringify()` on large objects logged multiple times (lines 357, etc)
- Improvement path: Remove redundant debug logs. Keep only error logs. Use structured logging for metrics.

**N+1 Query Pattern in User Details:**
- Problem: For admin dashboards listing users, each user triggers separate credit balance query
- Files: `server/services/admin-users.service.ts` (line 290 called per user)
- Cause: `getCreditBalance()` implemented as separate function, not batch operation
- Improvement path: Implement batch credit lookup. Use LEFT JOIN to user_credits table in main query.

---

## Fragile Areas

**Authentication Token Handling:**
- Files: `server/middleware/mobile-auth.ts`, `server/middleware/auth-utils.ts`
- Why fragile: Multiple try/catch blocks with different JWT error types. Easy to miss edge case (line 65-72 handles JsonWebTokenError, TokenExpiredError, but not other errors)
- Safe modification: Add comprehensive test coverage for all JWT error scenarios. Use JWT library's type definitions instead of string comparisons.
- Test coverage: `server/middleware/__tests__/admin-auth.middleware.test.ts` exists but is incomplete

**Admin User Service Data Retrieval:**
- Files: `server/services/admin-users.service.ts`
- Why fragile: Defensive coding in `getUserDetails()` (lines 287-319) suggests unstable credit balance retrieval. Multiple fallbacks to zero values.
- Safe modification: First stabilize `getCreditBalance()`. Add comprehensive logging to understand when/why it fails. Then remove defensive fallbacks.
- Test coverage: Limited - no unit tests for `getUserDetails()` with various credit scenarios

**Telegram Command Routing:**
- Files: `server/telegram/bot.ts`, `server/telegram/handlers/command-registry.ts`
- Why fragile: 484-line bot file with multiple message handler types (text, photo, voice, callbacks). Easy to miss handler in refactoring.
- Safe modification: Keep handlers separate by type. Add type guards to ensure handler execution path.
- Test coverage: E2E tests exist but need expansion for edge cases

**Password Recovery Flow:**
- Files: `server/services/password-recovery.service.ts`
- Why fragile: Depends on Telegram bot being initialized AND email service (not implemented). Two failure points with no clear fallback.
- Safe modification: Implement email service first. Add unit tests for both paths. Make one of them required.
- Test coverage: Minimal - no unit tests

---

## Scaling Limits

**In-Memory Cache for Metrics:**
- Current capacity: Single Node process, Map object, no size limit
- Limit: If metrics calculated frequently, memory grows unbounded. At scale, will cause OOM crashes.
- Scaling path:
  - Move to Redis (production)
  - Set TTL and max size per entry
  - Monitor cache hit ratio

**Database Query Volume:**
- Current capacity: PostgreSQL connection pool size varies (20 prod, 10 dev, 5 test)
- Limit: Each user admin page load = 7+ queries. At 100 concurrent users = 700+ queries. Could exhaust pool.
- Scaling path:
  - Implement query batching/aggregation
  - Add database query result caching
  - Monitor slow queries with `pg_stat_statements`

**Single-threaded Node Process:**
- Current capacity: Handles ~1000 concurrent connections (socket.io limit)
- Limit: CPU-heavy operations (AI parsing, forecasting) block other requests
- Scaling path:
  - Move OCR/AI to separate worker process or queue (Bull/RabbitMQ)
  - Use Node clusters for multi-core utilization
  - Add request timeouts to prevent hanging

---

## Dependencies at Risk

**node-telegram-bot-api v0.66.0:**
- Risk: Library is lightweight but not heavily maintained. Consider alternatives if long-polling causes production issues.
- Impact: Core Telegram bot functionality depends on this. If library breaks, bot stops.
- Migration plan: Maintain direct Telegram API client as fallback. Consider `telegraf` library as alternative.

**Multiple Competing Password Hashing Libraries:**
- Risk: `bcryptjs` v3.0.3 AND `bcrypt` v6.0.0 both installed. Only one is needed.
- Impact: Increases bundle size, potential for inconsistent password validation if both used
- Migration plan: Standardize on `bcrypt` (native binding, faster). Remove `bcryptjs` from dependencies.

**Express Session + Multiple Storage Options:**
- Risk: Code references both `memorystore` and `connect-pg-simple`. Unclear which is in production.
- Impact: If wrong store configured, sessions lost on restart or between instances
- Migration plan: Use `connect-pg-simple` for production (persistent). Document session store in CLAUDE.md.

**Socket.IO Without Redis Adapter:**
- Risk: Socket.IO included in dependencies but no adapter for distributed sessions
- Impact: At scale with multiple server instances, socket connections cannot be shared
- Migration plan: Add `@socket.io/redis-adapter` when deploying to multiple servers. Configure Redis pub/sub.

---

## Missing Critical Features

**Email Service Integration:**
- Problem: Password recovery, user notifications, marketing emails all require email service
- Blocks: Users cannot reset password via email if Telegram not linked. Cannot send marketing emails.
- Current state: Stub TODO in `password-recovery.service.ts`

**Real-time Metrics Calculation:**
- Problem: Admin metrics (MRR, LTV, CAC) hardcoded or cached, not real-time
- Blocks: Admin dashboard shows stale data. Cannot make data-driven decisions quickly.
- Current state: `admin-metrics.service.ts` has TODO comments for CAC calculation, 24-hour request counting

**User Rate Limiting by Tier:**
- Problem: Rate limiter exists but doesn't differentiate by user credit tier or plan
- Blocks: Free users could consume resources at same rate as premium users
- Current state: Fixed rate limits in `rate-limiter.ts`

---

## Test Coverage Gaps

**Authentication Middleware:**
- What's not tested: `mobile-auth.ts` JWT refresh scenarios, token expiry edge cases, blocked user handling
- Files: `server/middleware/mobile-auth.ts`
- Risk: Authentication bypass or token leaks could go unnoticed
- Priority: **HIGH** - Security-critical code with minimal test coverage

**Admin Services:**
- What's not tested: Most `admin-*.service.ts` files have no unit tests. Only integration tests exist.
- Files: `server/services/admin-users.service.ts`, `admin-metrics.service.ts`, etc.
- Risk: Refactoring could break admin panel unnoticed
- Priority: **HIGH** - Core product feature

**Password Recovery:**
- What's not tested: No unit tests for recovery code generation, validation, or Telegram sending
- Files: `server/services/password-recovery.service.ts`
- Risk: Password reset could silently fail or allow code reuse
- Priority: **MEDIUM** - Security-adjacent but not critical path

**Telegram Command Handlers:**
- What's not tested: Most command handlers lack unit tests. Only e2e tests exist.
- Files: `server/telegram/menu/*-handler.ts`, `server/telegram/commands/*.ts`
- Risk: Bot behavior changes could break user workflows
- Priority: **MEDIUM** - Many users rely on Telegram interface

**Error Handling:**
- What's not tested: Service error paths. Most tests only cover happy path.
- Files: Throughout `server/services/`
- Risk: Unknown error handling behavior in production
- Priority: **MEDIUM** - Error handling affects UX

---

## Recommendations Summary

**Immediate Actions (This Week):**
1. Remove debug logs from `admin-users.service.ts` (lines 220-357)
2. Implement email service (required for password recovery)
3. Add missing unit tests for authentication middleware

**Short Term (This Month):**
1. Split large service files (>500 LOC) into smaller modules
2. Replace `any` types with proper generics in middleware
3. Refactor user stats queries from N+1 to single aggregation
4. Implement refresh token pattern for mobile auth

**Medium Term (Q1):**
1. Stabilize credit balance calculation in admin service
2. Add comprehensive test coverage for admin services
3. Implement Redis for metrics caching
4. Move AI/OCR operations to worker queue

**Long Term (Q2+):**
1. Consider alternative libraries for core dependencies
2. Migrate to distributed session management
3. Implement comprehensive rate limiting by tier
4. Add real-time metrics calculation

---

*Concerns audit: 2026-02-19*
