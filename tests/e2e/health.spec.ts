import { test, expect } from '@playwright/test';

/**
 * Health Check E2E Test
 * 
 * FOR JUNIORS: This is the simplest E2E test - it just checks if the app is running.
 * We run this first to make sure the server is up before running other tests.
 * 
 * What it tests:
 * - Server is running and responding
 * - Main page loads without errors
 * - API health endpoint works (if exists)
 */
test.describe('Health Check', () => {
  test('should load main page', async ({ page }) => {
    // Navigate to main page
    await page.goto('/');
    
    // Wait for page to load (wait for network to be idle)
    await page.waitForLoadState('networkidle');
    
    // Check that page loaded (no errors)
    expect(page.url()).toContain('localhost:5000');
    
    // Check that page has content (not blank)
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(0);
  });

  test('should have working API endpoint', async ({ page }) => {
    // Try to access API health endpoint (if it exists)
    const response = await page.request.get('/api/health');
    
    // If endpoint exists, it should return 200
    // If it doesn't exist (404), that's also OK - we just check server is running
    expect([200, 404]).toContain(response.status());
  });

  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on login page
    expect(page.url()).toContain('/login');
    
    // Check that login form exists (email or password input)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // At least one of these should exist
    const hasEmailInput = await emailInput.count() > 0;
    const hasPasswordInput = await passwordInput.count() > 0;
    
    expect(hasEmailInput || hasPasswordInput).toBeTruthy();
  });
});
