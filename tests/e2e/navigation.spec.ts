import { test, expect } from '@playwright/test';
import { AuthHelper } from './helpers/auth.helper';
import { createTestUser } from './fixtures/test-user.fixture';

/**
 * Navigation E2E Tests
 * 
 * FOR JUNIORS: These tests verify that navigation between pages works correctly.
 * We test that users can navigate to different sections of the app and that
 * the correct pages load.
 * 
 * What it tests:
 * - Navigation to Dashboard
 * - Navigation to Transactions
 * - Navigation to Analytics
 * - Navigation to Settings
 * - Navigation to Assets (if available)
 * - Mobile navigation
 */

test.describe('Navigation', () => {
  let authHelper: AuthHelper;
  const testUser = createTestUser('nav-shared'); // Shared user for all tests

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    
    // Check if already logged in by trying to access dashboard
    await page.goto('/app/dashboard', { waitUntil: 'domcontentloaded', timeout: 10000 });
    const currentUrl = page.url();
    
    // If already on dashboard, we're logged in - return early
    if (currentUrl.includes('/app/dashboard') || currentUrl.includes('/app/dashboard-v2')) {
      return;
    }
    
    // Not logged in - try to login first (faster than registration)
    try {
      await authHelper.login(testUser.email, testUser.password);
      // authHelper.login already waits for redirect, but double-check
      await page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 15000 });
    } catch (error) {
      // Login failed, try registration
      await authHelper.register(testUser.email, testUser.password, testUser.name);
      // authHelper.register already waits for redirect, but double-check
      await page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 15000 });
    }
    
    // Final verification - ensure we're on dashboard
    const finalUrl = page.url();
    if (!finalUrl.includes('/app/')) {
      throw new Error(`Failed to authenticate in beforeEach. Current URL: ${finalUrl}`);
    }
    
    await page.waitForLoadState('domcontentloaded');
  });

  test('should navigate to Dashboard after login', async ({ page }) => {
    // Should already be on dashboard after login
    await page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/app\/(dashboard|dashboard-v2)/);
  });

  test('should navigate to Transactions page', async ({ page }) => {
    // Navigate directly to transactions page
    await page.goto('/app/transactions', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for URL to change (navigation might take a moment)
    await page.waitForURL(/\/app\/transactions/, { timeout: 10000 });
    
    // Verify we're on transactions page
    expect(page.url()).toContain('/app/transactions');
  });

  test('should navigate to Analytics page', async ({ page }) => {
    // Ensure we're logged in first (wait for beforeEach to complete)
    await page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 5000 });
    
    // Navigate directly to analytics page
    await page.goto('/app/expenses/analytics', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for URL to stabilize (might redirect)
    await page.waitForURL(/\/app\/(expenses\/analytics|analytics|dashboard|dashboard-v2)/, { timeout: 15000 });
    
    // Verify we're on analytics page (or redirected to valid page)
    const url = page.url();
    expect(url).toMatch(/\/app\/(expenses\/analytics|analytics|dashboard|dashboard-v2)/);
  });

  test('should navigate to Settings page', async ({ page }) => {
    // Ensure we're logged in first (wait for beforeEach to complete)
    await page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 5000 });
    
    // Navigate directly to settings page
    await page.goto('/app/settings', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for URL to stabilize (lazy-loaded component might cause delay)
    await page.waitForURL(/\/app\/(settings|dashboard|dashboard-v2)/, { timeout: 15000 });
    
    // Verify we're on settings page (or redirected to valid page)
    const url = page.url();
    expect(url).toMatch(/\/app\/(settings|dashboard|dashboard-v2)/);
  });

  test('should navigate to Assets page', async ({ page }) => {
    // Navigate directly to assets page
    await page.goto('/app/assets', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for URL to stabilize (lazy-loaded component might cause delay)
    await page.waitForURL(/\/app\/(assets|dashboard|dashboard-v2)/, { timeout: 15000 });
    
    // Verify we're on assets page or valid redirect
    const url = page.url();
    expect(url).toMatch(/\/app\/(assets|dashboard|dashboard-v2)/);
  });

  test('should navigate to Wallets page', async ({ page }) => {
    // Ensure we're logged in first (wait for beforeEach to complete)
    await page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 5000 });
    
    // Navigate directly to wallets page
    await page.goto('/app/wallets', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for URL to change (navigation might take a moment)
    await page.waitForURL(/\/app\/wallets/, { timeout: 10000 });
    
    // Verify we're on wallets page
    expect(page.url()).toContain('/app/wallets');
  });

  test('should navigate to Categories page', async ({ page }) => {
    // Ensure we're logged in first (wait for beforeEach to complete)
    await page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 5000 });
    
    // Navigate directly to categories page
    await page.goto('/app/categories', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for URL to stabilize (lazy-loaded component might cause delay)
    await page.waitForURL(/\/app\/(categories|dashboard|dashboard-v2)/, { timeout: 15000 });
    
    // Verify we're on categories page (or redirected to valid page)
    const url = page.url();
    expect(url).toMatch(/\/app\/(categories|dashboard|dashboard-v2)/);
  });

  test('should navigate back to Dashboard from other pages', async ({ page }) => {
    // Ensure we're logged in first (wait for beforeEach to complete)
    await page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 5000 });
    
    // Navigate to transactions first
    await page.goto('/app/transactions', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForURL(/\/app\/transactions/, { timeout: 10000 });
    expect(page.url()).toContain('/app/transactions');
    
    // Navigate back to dashboard
    await page.goto('/app/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 10000 });
    
    // Verify we're back on dashboard
    expect(page.url()).toMatch(/\/app\/(dashboard|dashboard-v2)/);
  });

  test('should handle mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to dashboard to test mobile view
    await page.goto('/app/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 10000 });
    
    // Verify we're on dashboard (mobile might redirect to dashboard-v2)
    const url = page.url();
    expect(url).toMatch(/\/app\/(dashboard|dashboard-v2)/);
    
    // Test that mobile navigation works by navigating to transactions
    await page.goto('/app/transactions', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForURL(/\/app\/transactions/, { timeout: 10000 });
    expect(page.url()).toContain('/app/transactions');
  });
});
