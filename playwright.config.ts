import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright E2E Test Configuration
 * 
 * FOR JUNIORS: This file configures Playwright for end-to-end testing.
 * E2E tests simulate real user interactions with the application.
 * 
 * Key settings:
 * - testDir: Where test files are located
 * - timeout: Maximum time for a single test (30 seconds)
 * - expect: Assertion timeout (5 seconds)
 * - fullyParallel: Run tests in parallel for speed
 * - forbidOnly: Fail CI if test.only() is used
 * - retries: Retry failed tests once
 * - workers: Number of parallel workers
 * - reporter: Where to output test results
 * - use: Default settings for all tests (browser, baseURL, etc.)
 * - projects: Different browser configurations
 * - webServer: Start dev server before tests
 */
export default defineConfig({
  // Directory containing test files
  testDir: './tests/e2e',
  
  // Global setup and teardown
  globalSetup: './tests/e2e/setup/global-setup.ts',
  globalTeardown: './tests/e2e/setup/global-teardown.ts',
  
  // Maximum time one test can run (30 seconds)
  timeout: 30 * 1000,
  
  // Maximum time for expect() assertions (5 seconds)
  expect: {
    timeout: 5000,
  },
  
  // Run tests in parallel for speed
  fullyParallel: true,
  
  // Fail CI if test.only() is accidentally left in code
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests once
  retries: process.env.CI ? 1 : 0,
  
  // Number of parallel workers (use 1 for debugging)
  workers: process.env.CI ? 2 : 1,
  
  // Reporter configuration
  reporter: process.env.CI 
    ? [['html'], ['github']] // HTML report + GitHub Actions annotations
    : [['html'], ['list']], // HTML report + console output
  
  // Global test settings
  use: {
    // Base URL for all tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5000',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Record trace on failure (for debugging)
    trace: 'retain-on-failure',
    
    // Action timeout (10 seconds)
    actionTimeout: 10000,
    
    // Navigation timeout (30 seconds)
    navigationTimeout: 30000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    // Uncomment to test in other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    
    // Mobile testing
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Start dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI, // Reuse existing server in local dev
    timeout: 120 * 1000, // Wait up to 2 minutes for server to start
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test',
      PORT: '5000',
    },
  },
});
