#!/usr/bin/env node
/**
 * Main metrics runner
 *
 * Runs all quality metrics and prints summary
 *
 * Usage: node scripts/metrics/index.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const METRICS = [
  { name: 'TypeScript any', script: 'count-any.js' },
  { name: 'File sizes', script: 'count-lines.js' },
  { name: 'Test files', script: 'count-tests.js' },
];

async function runMetric(metric) {
  return new Promise((resolve) => {
    const scriptPath = join(__dirname, metric.script);
    const proc = spawn('node', [scriptPath], { stdio: 'pipe' });

    let output = '';
    proc.stdout.on('data', (data) => { output += data; });
    proc.stderr.on('data', (data) => { output += data; });

    proc.on('close', (code) => {
      resolve({ ...metric, passed: code === 0, output });
    });
  });
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log('       BudgetBot Quality Metrics        ');
  console.log('========================================');
  console.log('');

  const results = [];

  for (const metric of METRICS) {
    const result = await runMetric(metric);
    results.push(result);
    console.log(result.output);
  }

  // Summary
  console.log('========================================');
  console.log('                Summary                 ');
  console.log('========================================');
  console.log('');

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  for (const r of results) {
    const status = r.passed ? 'PASS' : 'FAIL';
    console.log(`  [${status}] ${r.name}`);
  }

  console.log('');
  console.log(`Total: ${passed}/${results.length} passed`);
  console.log('');

  if (failed > 0) {
    console.log('Some metrics failed. See details above.');
    process.exit(1);
  } else {
    console.log('All metrics passed!');
    process.exit(0);
  }
}

main().catch(console.error);
