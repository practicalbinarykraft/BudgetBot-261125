#!/usr/bin/env node
/**
 * Count test files
 *
 * Goal: 50+ test files with good coverage
 *
 * Usage: node scripts/metrics/count-tests.js
 */

import { readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const DIRS = ['server', 'client/src', 'shared', 'tests'];
const MIN_TEST_FILES = 50;
const TEST_PATTERNS = ['.test.ts', '.test.tsx', '.spec.ts', '.spec.tsx'];

function walkDir(dir, files = []) {
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      if (item === 'node_modules' || item.startsWith('.')) continue;

      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath, files);
      } else if (TEST_PATTERNS.some(p => item.endsWith(p))) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }
  return files;
}

try {
  const testFiles = [];

  for (const dir of DIRS) {
    walkDir(dir, testFiles);
  }

  console.log('');
  console.log('Test Files Count');
  console.log('=================');
  console.log(`Found: ${testFiles.length} test files`);
  console.log(`Target: ${MIN_TEST_FILES}+ files`);
  console.log('');

  if (testFiles.length > 0) {
    console.log('Test files:');
    for (const f of testFiles.slice(0, 10)) {
      console.log(`  ${relative('.', f)}`);
    }
    if (testFiles.length > 10) {
      console.log(`  ... and ${testFiles.length - 10} more`);
    }
    console.log('');
  }

  if (testFiles.length >= MIN_TEST_FILES) {
    console.log('PASS - Sufficient test coverage!');
    process.exit(0);
  } else {
    const needed = MIN_TEST_FILES - testFiles.length;
    console.log(`FAIL - Need ${needed} more test files`);
    process.exit(1);
  }
} catch (error) {
  console.error('Error counting tests:', error.message);
  process.exit(1);
}
