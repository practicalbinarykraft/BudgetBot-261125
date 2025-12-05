#!/usr/bin/env node
/**
 * Count TypeScript 'any' occurrences
 *
 * Goal: 0 untyped 'any' in production code
 *
 * Usage: node scripts/metrics/count-any.js
 */

import { execSync } from 'child_process';

const DIRS = ['server/', 'client/src/', 'shared/'];
const MAX_ALLOWED = 10;

try {
  const command = `grep -r " any" ${DIRS.join(' ')} --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | wc -l`;
  const result = execSync(command, { encoding: 'utf-8' }).trim();
  const count = parseInt(result, 10);

  console.log('');
  console.log('TypeScript "any" Count');
  console.log('========================');
  console.log(`Current: ${count}`);
  console.log(`Target:  <${MAX_ALLOWED}`);
  console.log('');

  if (count <= MAX_ALLOWED) {
    console.log('PASS - Within target!');
    process.exit(0);
  } else {
    console.log(`FAIL - ${count - MAX_ALLOWED} over limit`);
    process.exit(1);
  }
} catch (error) {
  console.error('Error counting any:', error.message);
  process.exit(1);
}
