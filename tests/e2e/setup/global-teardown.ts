import { FullConfig } from '@playwright/test';

/**
 * Global Teardown for E2E Tests
 * 
 * FOR JUNIORS: This file runs ONCE after all tests finish.
 * Use it to:
 * - Clean up test data
 * - Close database connections
 * - Stop services
 * 
 * Note: The webServer in playwright.config.ts handles stopping the dev server automatically.
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Global teardown: Cleaning up...');
  
  // Add any global cleanup here if needed
  // For example: cleanup test database, close connections, etc.
  
  console.log('✅ Global teardown complete!');
}

export default globalTeardown;
