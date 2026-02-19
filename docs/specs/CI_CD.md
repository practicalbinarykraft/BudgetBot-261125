# CI/CD Pipeline

## Overview

Continuous Integration and Deployment for BudgetBot.
CI runs on every push/PR to `main`. Deploy runs automatically after CI passes on `main`.

```
push to main → CI (test) → deploy (SSH) → healthcheck
                ↓
            PR check (test only, no deploy)
```

## Trigger

| Event        | Branches       | Jobs             |
|-------------|---------------|------------------|
| `push`      | `main`, `master` | test → deploy → metrics |
| `pull_request` | `main`, `master` | test, metrics (no deploy) |

Deploy only runs on push to `main` (i.e. after PR merge).

## Test Job

Runs on `ubuntu-latest` with PostgreSQL 16 service container.

Steps:
1. **Checkout** — `actions/checkout@v4`
2. **Node.js 20** — `actions/setup-node@v4` with npm cache
3. **Install** — `npm ci` (root + mobile)
4. **Lint: test.skip** — fails if `test.skip`/`it.skip`/`describe.skip` found in test files
5. **Lint: console.log** — fails if `console.log` found in server code (excluding tests and env.ts)
6. **Lint: console.log (client)** — warning only, doesn't fail
7. **Type check** — `npm run check` (tsc)
8. **DB setup** — `npm run db:push` (Drizzle migrations)
9. **Server & web tests** — `npm run test:run` (vitest)
10. **Mobile tests** — `cd mobile && npm test -- --forceExit` (jest)
11. **Build** — `npm run build`

Environment variables for test:
- `DATABASE_URL=postgres://test:test@localhost:5432/budgetbot_test`
- `SESSION_SECRET=test-session-secret-must-be-32-chars`
- `ENCRYPTION_KEY=U4rnuZd9jFqJb5yokp5e1DrI8QCmSZx8HpDX4lLZUqI=`

## Deploy Job

Runs after `test` passes, only on push to `main`.

**Concurrency:** `production-deploy` group with `cancel-in-progress: false` — queues deploys instead of cancelling, ensuring every merge gets deployed in order.

### SSH Access

- Uses `appleboy/ssh-action@v1`
- Connects to production server via SSH key
- GitHub Secrets: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`

### Deploy Script

```bash
cd /root/BudgetBot-Improved
git pull origin main
npm run build
pm2 restart budgetbot
sleep 3
```

### Post-Deploy Verification

Three checks run after restart:

1. **pm2 status** — verifies process is `online` (not crashed/errored)
2. **HTTP healthcheck** — `curl /api/health` must return 200
3. **OCR status** — `curl /api/health/ocr` logs OCR subsystem state (non-blocking)

If pm2 or HTTP check fails, the deploy step exits with code 1 and GitHub Actions marks it as failed.

## Metrics Job

Runs after `test` passes (on both push and PR). Non-blocking (`continue-on-error: true`).

## Monitoring Endpoints

| Endpoint | Purpose | Blocking |
|----------|---------|----------|
| `GET /api/health` | Basic liveness (200 if server up) | Yes |
| `GET /api/health/detailed` | DB + Redis status | No |
| `GET /api/health/ocr` | OCR provider status (keys, registry) | No |
| `GET /api/health/ready` | Readiness probe (DB check) | No |
| `GET /api/health/live` | Liveness probe (always 200) | No |

## Rollback

Auto-rollback is not implemented. Manual rollback:

```bash
ssh root@<DEPLOY_HOST>
cd /root/BudgetBot-Improved

# Option 1: Revert to previous commit
git log --oneline -5          # find the good commit
git revert HEAD               # revert the bad merge
npm run build
pm2 restart budgetbot

# Option 2: Hard reset (destructive — use only if revert is complex)
git reset --hard <good-commit>
npm run build
pm2 restart budgetbot
```

After rollback, verify:
```bash
pm2 show budgetbot | grep status    # should say "online"
curl -sf http://localhost:5000/api/health
```

## Logs

On the server:
```bash
pm2 logs budgetbot --lines 50 --nostream   # recent logs
pm2 logs budgetbot                          # live tail
journalctl -u nginx --since "5 min ago"    # nginx logs
```

In GitHub Actions: check the "Deploy to production" step output for healthcheck results.

## GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Production server IP |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | Ed25519 private key for SSH |

## Adding New Checks

To add a new CI lint step, add it between "Install" and "Type check" in `ci.yml`.
To add a new post-deploy check, add it after the healthcheck block in the deploy script.
