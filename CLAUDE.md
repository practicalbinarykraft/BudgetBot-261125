# BudgetBot — Agent Onboarding Guide

## What is this project

BudgetBot (Budget Buddy) — personal finance manager. Three clients, one Node.js backend:

- **Web client** (`client/`) — React + Vite, served from `budgetbot.online` via Express static
- **Mobile web** (`mobile/`) — React Native + Expo Web, served from `m.budgetbot.online` via nginx static
- **Telegram bot** — inline bot for quick expense logging

Backend: Express + PostgreSQL (Drizzle ORM) + Socket.IO + pm2. Server at `5.129.230.171`.

## Project structure

```
client/          — React web app (Vite, shadcn/ui)
mobile/          — Expo app (React Native, works as web too)
server/          — Express API server
  routes/        — API route handlers
  services/      — Business logic (keep <150 LOC per file)
  repositories/  — Database queries (Drizzle ORM)
  middleware/     — Auth, CORS, rate limiting
  lib/           — Utilities (logger, errors, encryption)
  types/         — TypeScript types and billing
shared/          — Shared schema (Drizzle tables)
nginx/           — Production nginx configs (tracked in repo!)
docs/            — Documentation, specs, changelogs
```

## Architecture rules

### Junior-friendly code
- Every service file should be **under 150 lines**. If it grows — split.
- Name files descriptively: `receipt-parser.service.ts`, not `parser.ts`.
- Comments in Russian are OK — the team uses both Russian and English.
- Prefer explicit over clever. No magic, no deep abstractions.

### TDD approach
1. **Write tests first** when adding new logic (services, utilities).
2. Tests live in `__tests__/` directories next to the code they test.
3. Use **vitest** for server tests, **jest** for mobile tests.
4. Mock external APIs (Anthropic, OpenAI) — never call real APIs in tests.
5. Test file naming: `<module-name>.test.ts`.
6. Run before committing:
   - Server: `npx vitest run`
   - Mobile: `cd mobile && npx jest --forceExit`

### Test patterns used in this project
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../some-dependency', () => ({
  someFunction: vi.fn(),
}));

describe('ModuleName', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does the expected thing', () => {
    // arrange → act → assert
  });
});
```

### Integration tests (`*.int.test.ts`)
- Integration tests use a real Postgres database (not mocked).
- In CI, Postgres runs as a service container — tests execute normally.
- Locally, if no Postgres is available, these tests **skip automatically** via `skipIf(!dbAvailable)`. This is expected behavior, not a bug.
- To run them locally: start Postgres and set `DATABASE_URL` in `.env`.

### Known pre-existing test failures (not your fault)
- `server/services/__tests__/notification.service.test.ts` — 3 tests fail (date-related)
- `server/services/__tests__/password-reset.service.test.ts` — 1 test fails (DB constraint)

These are NOT caused by recent changes. Don't waste time fixing them unless explicitly asked.

## Git workflow

1. **Never commit to main directly.** Create a branch: `fix/description` or `feat/description`.
2. Commit messages: `fix(scope): description` or `feat(scope): description`.
3. Always create a PR with summary + test plan.
4. CI runs `tsc` (type check) on every PR — must pass.
5. After PR merge → deploy is **automatic** (CI runs `deploy` job on push to main). See `docs/specs/CI_CD.md`.

## Deployment (auto-deploy from main)

Server deploys automatically after CI passes on main.
Deploy script: `/root/deploy.sh` on production server.
SSH key is restricted with `command=` — can only run the deploy script.
See `docs/specs/CI_CD.md` for full pipeline docs.

### Manual deploy (if CI is broken)
```bash
ssh root@5.129.230.171
cd /root/BudgetBot-Improved
git pull origin main
npm run build
pm2 restart budgetbot
pm2 logs budgetbot --lines 20 --nostream
```

### Mobile web (m.budgetbot.online)
```bash
ssh root@5.129.230.171
cd /root/BudgetBot-Improved/mobile
npm install
EXPO_PUBLIC_API_URL=https://m.budgetbot.online npx expo export --platform web --output-dir /var/www/m.budgetbot.online --clear
```

**CRITICAL:** Always pass `EXPO_PUBLIC_API_URL=https://m.budgetbot.online`. Without it, the build defaults to `localhost:5000` and nothing works.

### Nginx
If you change nginx configs in `nginx/` directory, also apply them on the server:
```bash
cp nginx/m.budgetbot.online /etc/nginx/sites-enabled/m.budgetbot.online
nginx -t && nginx -s reload
```

## Key technical decisions

### API key management
- `server/services/api-key-manager.ts` — central hub for API keys.
- Users can bring their own key (BYOK) or use system credits.
- `getApiKey(userId, operation)` → returns key + billing info.
- `getSystemKey(provider)` → returns system env key. Throws if not set.

### OCR receipt parsing
- Primary: Anthropic Claude Sonnet (`receipt-parser.service.ts`)
- Fallback: OpenAI GPT-4o (`openai-receipt-parser.service.ts`)
- Orchestrator: `receipt-ocr-fallback.ts` — tries Anthropic, falls back on billing/rate errors
- **Important:** `getSystemKey('openai')` is wrapped in try/catch in the route. If OpenAI key is missing, Anthropic still works normally.

### CORS
- Express CORS: `server/middleware/cors.ts` — exports `ALLOWED_ORIGINS`
- Socket.IO CORS: `server/lib/websocket.ts` — imports same `ALLOWED_ORIGINS`
- Both must stay in sync. If you add a new domain, add it in `cors.ts`.

### Two separate web apps
- `budgetbot.online` → Express serves `dist/public/` (Vite build)
- `m.budgetbot.online` → nginx serves `/var/www/m.budgetbot.online/` (Expo Web build)
- They share the same API on port 5000, but are deployed separately.
- nginx for `m.` proxies `/api/` and `/socket.io/` to `localhost:5000`.

## Common pitfalls

1. **Don't call `getSystemKey()` unconditionally** — it throws if env var is missing. Always wrap in try/catch or check first.
2. **TypeScript strict mode** — CI runs `tsc`. If you pass `string` where a union type is expected (e.g. mime types), it will fail. Cast explicitly.
3. **Expo Web build caching** — use `--clear` flag when rebuilding. Metro bundler caches aggressively.
4. **Service Worker** — `client/public/sw.js` uses cache-first for static assets. Bump the version (`budgetbuddy-v5` → `v6`) when deploying breaking frontend changes. Otherwise users see stale builds.
5. **nginx SPA fallback** — `try_files $uri $uri/ /index.html` catches everything including `/api/` if there's no explicit `location /api/` block. Always put API proxy ABOVE the SPA fallback.
6. **`navigation.goBack()` vs `navigate("Main")`** — after multi-step flows (receipt scan → add transaction), `goBack()` returns to the previous step, not the dashboard. Use `navigate("Main")` to skip back to root.

## Environment variables (production)

Server `.env` at `/root/BudgetBot-Improved/.env`:
- `NODE_ENV=production`
- `SYSTEM_ANTHROPIC_API_KEY` — Claude API (OCR, AI advisor)
- `SYSTEM_OPENAI_API_KEY` — GPT-4o (OCR fallback, voice transcription)
- `SYSTEM_DEEPSEEK_API_KEY` — categorization, normalization
- `SESSION_SECRET` — JWT signing
- `DATABASE_URL` — PostgreSQL connection
- `BILLING_ENABLED` — enable/disable credit system

## Documentation

All docs are in the root directory and `docs/`. Key ones:
- `PROGRESS.md` — overall project progress tracker
- `replit.md` — project overview and architecture
- `docs/specs/MOBILE_FULL_AUDIT.md` — web vs mobile parity audit
- `docs/changelog-2026-02-18.md` — latest changelog
- `DEPLOYMENT_CHECKLIST.md` — deployment steps

Write changelogs as `docs/changelog-YYYY-MM-DD.md` after significant work sessions.

## Recommendations

- **Read before you write.** Always read the existing file before modifying it. Understand the patterns.
- **Keep files small.** If a service grows past 150 LOC, split it.
- **Test the happy path AND the error path.** Especially for external API calls.
- **Don't over-engineer.** This project values simplicity. Three similar lines > one premature abstraction.
- **Check both web and mobile** after backend changes. They share the API but have different clients.
- **Log meaningful context.** Use `logInfo`, `logWarning`, `logError` from `server/lib/logger`.
- **Deploy carefully.** Auto-deploy runs on merge to main. Check GitHub Actions for deploy status. Manual rollback: see `docs/specs/CI_CD.md`.
- **When in doubt, ask the user.** Don't guess requirements. Don't add features that weren't requested.
