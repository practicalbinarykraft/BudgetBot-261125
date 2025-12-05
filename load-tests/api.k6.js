/**
 * k6 Load Test: API Endpoints
 *
 * Tests authenticated API endpoints under load.
 * Requires a test user to be set up.
 *
 * Run: k6 run -e EMAIL=test@example.com -e PASSWORD=testpass load-tests/api.k6.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');

// Test configuration
export const options = {
  scenarios: {
    // API load test
    api_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 5 },   // Ramp up
        { duration: '2m', target: 5 },    // Sustained load
        { duration: '30s', target: 0 },   // Ramp down
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],    // 95% under 1s
    http_req_failed: ['rate<0.05'],       // Less than 5% failures
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
const TEST_EMAIL = __ENV.EMAIL || 'loadtest@example.com';
const TEST_PASSWORD = __ENV.PASSWORD || 'loadtest123';

// Shared session cookie
let sessionCookie = null;

export function setup() {
  // Login to get session
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status === 200) {
    // Extract session cookie
    const cookies = loginRes.cookies;
    if (cookies['connect.sid']) {
      sessionCookie = cookies['connect.sid'][0].value;
      console.log('Login successful');
    }
  } else {
    console.log('Login failed - tests will run without auth');
  }

  return { sessionCookie };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add session cookie if available
  const jar = http.cookieJar();
  if (data.sessionCookie) {
    jar.set(BASE_URL, 'connect.sid', data.sessionCookie);
  }

  // Test public endpoints
  group('Public Endpoints', function () {
    const healthRes = http.get(`${BASE_URL}/api/health`);
    check(healthRes, { 'health ok': (r) => r.status === 200 });
    apiDuration.add(healthRes.timings.duration);
  });

  // Test authenticated endpoints (if logged in)
  if (data.sessionCookie) {
    group('Authenticated Endpoints', function () {
      // Get wallets
      const walletsRes = http.get(`${BASE_URL}/api/wallets`, { headers });
      const walletsOk = check(walletsRes, {
        'wallets status 200': (r) => r.status === 200,
        'wallets is array': (r) => Array.isArray(JSON.parse(r.body)),
      });
      errorRate.add(!walletsOk);
      apiDuration.add(walletsRes.timings.duration);

      // Get categories
      const categoriesRes = http.get(`${BASE_URL}/api/categories`, { headers });
      check(categoriesRes, { 'categories ok': (r) => r.status === 200 });
      apiDuration.add(categoriesRes.timings.duration);

      // Get transactions (with limit)
      const txRes = http.get(`${BASE_URL}/api/transactions?limit=20`, { headers });
      check(txRes, { 'transactions ok': (r) => r.status === 200 });
      apiDuration.add(txRes.timings.duration);

      // Get stats
      const statsRes = http.get(`${BASE_URL}/api/stats`, { headers });
      check(statsRes, { 'stats ok': (r) => r.status === 200 });
      apiDuration.add(statsRes.timings.duration);
    });
  }

  sleep(1);
}

export function teardown(data) {
  // Logout if we were logged in
  if (data.sessionCookie) {
    http.post(`${BASE_URL}/api/auth/logout`);
  }
  console.log('API load test completed');
}
