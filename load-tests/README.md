# Load Tests

Performance and load testing for BudgetBot API.

## Quick Start

### Simple Load Test (No Dependencies)

```bash
# Run with default settings (10 users, 50 requests each)
npx tsx load-tests/simple-load-test.ts

# Custom settings
USERS=20 REQUESTS=100 npx tsx load-tests/simple-load-test.ts

# Against production
BASE_URL=https://your-app.com npx tsx load-tests/simple-load-test.ts
```

### k6 Load Tests (Advanced)

First, install k6: https://k6.io/docs/get-started/installation/

```bash
# Health endpoint tests
k6 run load-tests/health.k6.js

# API endpoint tests (requires test user)
k6 run -e EMAIL=test@example.com -e PASSWORD=testpass load-tests/api.k6.js

# Custom base URL
k6 run -e BASE_URL=http://localhost:5000 load-tests/health.k6.js
```

## Test Files

| File | Description | Duration |
|------|-------------|----------|
| `simple-load-test.ts` | Node.js basic load test | ~30s |
| `health.k6.js` | Health endpoints (smoke/load/stress) | ~5min |
| `api.k6.js` | Authenticated API endpoints | ~3min |

## Performance Thresholds

| Metric | Target |
|--------|--------|
| Health check response | < 100ms (p95) |
| API response | < 1000ms (p95) |
| Error rate | < 1% |
| Success rate | > 99% |

## Scenarios

### Smoke Test
- 1 virtual user
- 10 seconds
- Verifies basic functionality

### Load Test
- 10 virtual users
- Ramp up over 30s, sustain 1min, ramp down
- Normal expected load

### Stress Test
- 50 virtual users
- Ramp up over 30s, sustain 1min, ramp down
- Beyond normal load (find breaking point)

## Results Interpretation

✅ **PASSED**: All thresholds met
❌ **FAILED**: One or more thresholds exceeded

Check the output for:
- Response times (min/avg/max/p95)
- Error rate percentage
- Requests per second (RPS)
