/**
 * Simple Load Test Script
 *
 * Node.js-based load test that doesn't require k6.
 * Junior-Friendly: Uses built-in modules only.
 *
 * Run: npx tsx load-tests/simple-load-test.ts
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const CONCURRENT_USERS = parseInt(process.env.USERS || '10', 10);
const DURATION_SECONDS = parseInt(process.env.DURATION || '30', 10);
const REQUESTS_PER_USER = parseInt(process.env.REQUESTS || '50', 10);

interface TestResult {
  endpoint: string;
  success: number;
  failed: number;
  totalTime: number;
  minTime: number;
  maxTime: number;
  avgTime: number;
}

const results: Map<string, TestResult> = new Map();

async function makeRequest(url: string): Promise<{ ok: boolean; duration: number }> {
  const start = Date.now();
  try {
    const response = await fetch(url);
    const duration = Date.now() - start;
    return { ok: response.ok, duration };
  } catch {
    return { ok: false, duration: Date.now() - start };
  }
}

function recordResult(endpoint: string, ok: boolean, duration: number): void {
  let result = results.get(endpoint);
  if (!result) {
    result = {
      endpoint,
      success: 0,
      failed: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      avgTime: 0,
    };
    results.set(endpoint, result);
  }

  if (ok) {
    result.success++;
  } else {
    result.failed++;
  }
  result.totalTime += duration;
  result.minTime = Math.min(result.minTime, duration);
  result.maxTime = Math.max(result.maxTime, duration);
  result.avgTime = result.totalTime / (result.success + result.failed);
}

async function runUser(userId: number): Promise<void> {
  const endpoints = [
    '/api/health',
    '/api/health/live',
    '/api/health/ready',
  ];

  for (let i = 0; i < REQUESTS_PER_USER; i++) {
    const endpoint = endpoints[i % endpoints.length];
    const { ok, duration } = await makeRequest(`${BASE_URL}${endpoint}`);
    recordResult(endpoint, ok, duration);

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

function printResults(): void {
  console.log('\n' + '='.repeat(70));
  console.log('LOAD TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
  console.log(`Requests per User: ${REQUESTS_PER_USER}`);
  console.log('='.repeat(70) + '\n');

  let totalSuccess = 0;
  let totalFailed = 0;

  results.forEach((result) => {
    totalSuccess += result.success;
    totalFailed += result.failed;

    const total = result.success + result.failed;
    const successRate = ((result.success / total) * 100).toFixed(1);

    console.log(`Endpoint: ${result.endpoint}`);
    console.log(`  Requests: ${total} (${result.success} success, ${result.failed} failed)`);
    console.log(`  Success Rate: ${successRate}%`);
    console.log(`  Response Time: min=${result.minTime}ms, avg=${Math.round(result.avgTime)}ms, max=${result.maxTime}ms`);
    console.log('');
  });

  const overallRate = ((totalSuccess / (totalSuccess + totalFailed)) * 100).toFixed(1);
  console.log('='.repeat(70));
  console.log(`OVERALL: ${totalSuccess + totalFailed} requests, ${overallRate}% success rate`);
  console.log('='.repeat(70));

  // Pass/fail based on thresholds
  const passed = totalFailed === 0 || (totalFailed / (totalSuccess + totalFailed)) < 0.01;
  console.log(`\nResult: ${passed ? '✅ PASSED' : '❌ FAILED'}`);

  process.exit(passed ? 0 : 1);
}

async function main(): Promise<void> {
  console.log('Starting load test...');
  console.log(`Testing ${BASE_URL} with ${CONCURRENT_USERS} concurrent users`);

  // Verify server is up
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (!res.ok) throw new Error('Server not healthy');
  } catch (error) {
    console.error('Error: Server is not responding at', BASE_URL);
    process.exit(1);
  }

  const startTime = Date.now();

  // Run concurrent users
  const users = Array.from({ length: CONCURRENT_USERS }, (_, i) => runUser(i));
  await Promise.all(users);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nCompleted in ${elapsed}s`);

  printResults();
}

main().catch(console.error);
