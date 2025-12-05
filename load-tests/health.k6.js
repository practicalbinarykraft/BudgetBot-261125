/**
 * k6 Load Test: Health Endpoints
 *
 * Tests the health check endpoints under load.
 * Junior-Friendly: Clear scenarios with comments
 *
 * Run: k6 run load-tests/health.k6.js
 * With env: k6 run -e BASE_URL=http://localhost:5000 load-tests/health.k6.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const healthCheckDuration = new Trend('health_check_duration');

// Test configuration
export const options = {
  // Scenarios for different load patterns
  scenarios: {
    // Smoke test: minimal load to verify everything works
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '10s',
      startTime: '0s',
    },
    // Load test: normal expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },  // Ramp up to 10 users
        { duration: '1m', target: 10 },   // Stay at 10 users
        { duration: '30s', target: 0 },   // Ramp down
      ],
      startTime: '15s',
    },
    // Stress test: beyond normal load
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },  // Ramp up to 50 users
        { duration: '1m', target: 50 },   // Stay at 50 users
        { duration: '30s', target: 0 },   // Ramp down
      ],
      startTime: '3m',
    },
  },
  // Thresholds for pass/fail
  thresholds: {
    http_req_duration: ['p(95)<500'],     // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],       // Less than 1% failures
    errors: ['rate<0.01'],                // Less than 1% errors
    health_check_duration: ['p(95)<200'], // Health checks under 200ms
  },
};

// Base URL from environment or default
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Main test function
export default function () {
  // Test basic health endpoint
  const healthRes = http.get(`${BASE_URL}/api/health`);
  
  const healthChecks = check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health response has status ok': (r) => {
      const body = JSON.parse(r.body);
      return body.status === 'ok';
    },
    'health response time < 100ms': (r) => r.timings.duration < 100,
  });

  errorRate.add(!healthChecks);
  healthCheckDuration.add(healthRes.timings.duration);

  // Test detailed health endpoint (less frequently)
  if (Math.random() < 0.2) {
    const detailedRes = http.get(`${BASE_URL}/api/health/detailed`);
    
    check(detailedRes, {
      'detailed health status is 200': (r) => r.status === 200,
      'detailed health shows healthy': (r) => {
        const body = JSON.parse(r.body);
        return body.status === 'healthy';
      },
    });
  }

  // Test liveness probe
  const liveRes = http.get(`${BASE_URL}/api/health/live`);
  check(liveRes, {
    'liveness probe returns 200': (r) => r.status === 200,
  });

  // Small delay between iterations
  sleep(0.5);
}

// Setup function (runs once before tests)
export function setup() {
  console.log(`Testing against: ${BASE_URL}`);
  
  // Verify server is running
  const res = http.get(`${BASE_URL}/api/health`);
  if (res.status !== 200) {
    throw new Error('Server is not responding');
  }
  
  return { baseUrl: BASE_URL };
}

// Teardown function (runs once after tests)
export function teardown(data) {
  console.log('Load test completed');
}
