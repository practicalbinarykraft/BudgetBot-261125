#!/usr/bin/env node
/**
 * Count files exceeding 200 lines
 *
 * Goal: 0 files over 200 lines (junior-friendly)
 *
 * Usage: node scripts/metrics/count-lines.js
 */

import { execSync } from 'child_process';
import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';

const DIRS = ['server', 'client/src', 'shared'];
const MAX_LINES = 200;
const EXTENSIONS = ['.ts', '.tsx'];

function countLines(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  return content.split('\n').length;
}

function walkDir(dir, files = []) {
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      if (item === 'node_modules' || item.startsWith('.')) continue;

      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walkDir(fullPath, files);
      } else if (EXTENSIONS.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Directory doesn't exist
  }
  return files;
}

try {
  const violations = [];

  for (const dir of DIRS) {
    const files = walkDir(dir);
    for (const file of files) {
      const lines = countLines(file);
      if (lines > MAX_LINES) {
        violations.push({ file: relative('.', file), lines });
      }
    }
  }

  violations.sort((a, b) => b.lines - a.lines);

  console.log('');
  console.log('Files Exceeding 200 Lines');
  console.log('==========================');
  console.log(`Found: ${violations.length} files`);
  console.log(`Target: 0 files`);
  console.log('');

  if (violations.length > 0) {
    console.log('Violations:');
    for (const v of violations.slice(0, 15)) {
      console.log(`  ${v.file}: ${v.lines} lines`);
    }
    if (violations.length > 15) {
      console.log(`  ... and ${violations.length - 15} more`);
    }
    console.log('');
    console.log(`FAIL - ${violations.length} files need refactoring`);
    process.exit(1);
  } else {
    console.log('PASS - All files under 200 lines!');
    process.exit(0);
  }
} catch (error) {
  console.error('Error counting lines:', error.message);
  process.exit(1);
}
