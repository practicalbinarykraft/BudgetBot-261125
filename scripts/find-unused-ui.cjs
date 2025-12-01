#!/usr/bin/env node
/**
 * Find unused UI components
 * Scans all UI components and checks if they're imported anywhere
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const UI_DIR = path.join(__dirname, '../client/src/components/ui');
const SRC_DIR = path.join(__dirname, '../client/src');

// Get all UI component files
const uiFiles = fs.readdirSync(UI_DIR)
  .filter(file => file.endsWith('.tsx') && file !== 'index.tsx');

console.log(`📊 Found ${uiFiles.length} UI components\n`);

const unused = [];
const used = [];

for (const file of uiFiles) {
  const componentName = path.basename(file, '.tsx');

  try {
    // Search for imports of this component
    const result = execSync(
      `grep -r "from.*ui/${componentName}" ${SRC_DIR} --exclude-dir=ui || true`,
      { encoding: 'utf-8' }
    );

    if (result.trim() === '') {
      unused.push(componentName);
      console.log(`❌ Unused: ${componentName}`);
    } else {
      used.push(componentName);
      console.log(`✅ Used: ${componentName}`);
    }
  } catch (error) {
    // grep returns exit code 1 when no match found
    unused.push(componentName);
    console.log(`❌ Unused: ${componentName}`);
  }
}

console.log(`\n📈 Summary:`);
console.log(`   Used: ${used.length}`);
console.log(`   Unused: ${unused.length}`);
console.log(`   Potential savings: ~${(unused.length / uiFiles.length * 100).toFixed(1)}%`);

if (unused.length > 0) {
  console.log(`\n🗑️  Unused components:`);
  unused.forEach(name => console.log(`   - ${name}.tsx`));
}
