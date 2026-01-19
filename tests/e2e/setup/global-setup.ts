import { chromium, FullConfig } from '@playwright/test';

/**
 * Global Setup for E2E Tests
 * 
 * FOR JUNIORS: This file runs ONCE before all tests start.
 * Use it to:
 * - Start the dev server (handled by webServer in playwright.config.ts)
 * - Set up test database
 * - Create test data
 * - Authenticate once for all tests
 * 
 * The webServer config in playwright.config.ts handles starting the dev server,
 * so we mainly use this for database setup if needed.
 */
async function globalSetup(config: FullConfig) {
  // The webServer config in playwright.config.ts handles server startup
  // This function is mainly for additional setup if needed
  
  // Example: Wait for server to be ready
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:5000';
  
  console.log('🔧 Global setup: Waiting for server to be ready...');
  
  // Wait for server health check
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  let retries = 30; // 30 seconds max
  while (retries > 0) {
    try {
      const response = await page.goto(`${baseURL}/api/health`, { timeout: 5000, waitUntil: 'networkidle' });
      if (response?.ok()) {
        console.log('✅ Server is ready!');
        break;
      }
    } catch (error) {
      // Server not ready yet, wait and retry
      retries--;
      if (retries === 0) {
        throw new Error('Server failed to start within timeout');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  await browser.close();
  console.log('✅ Global setup complete!');
}

export default globalSetup;
