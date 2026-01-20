import { Page } from '@playwright/test';

/**
 * Authentication Helper Functions
 * 
 * FOR JUNIORS: These functions help with common authentication tasks in tests.
 * Instead of writing the same login code in every test, we reuse these helpers.
 * 
 * Usage:
 *   const authHelper = new AuthHelper(page);
 *   await authHelper.login('user@example.com', 'password');
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to login page
   */
  async gotoLogin(): Promise<void> {
    await this.page.goto('/login');
  }

  /**
   * Fill login form and submit
   */
  async fillLoginForm(email: string, password: string): Promise<void> {
    await this.page.fill('input[data-testid="input-email-login"], input[type="email"]', email);
    await this.page.fill('input[data-testid="input-password-login"], input[type="password"]', password);
  }

  /**
   * Click login button
   */
  async clickLoginButton(): Promise<void> {
    await this.page.click('button[data-testid="button-login"], button:has-text("Войти"), button:has-text("Login")');
  }

  /**
   * Complete login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.gotoLogin();
    await this.fillLoginForm(email, password);
    await this.clickLoginButton();
    
    // Wait for redirect to dashboard (increased timeout for reliability)
    await this.page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 20000 });
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, name?: string): Promise<void> {
    await this.page.goto('/login');
    
    // Wait for page to load
    await this.page.waitForLoadState('domcontentloaded');
    
    // Switch to registration tab
    const registerTab = this.page.locator('button[role="tab"]:has-text("Регистрация"), button[role="tab"]:has-text("Register")').first();
    
    if (await registerTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await registerTab.click();
      await this.page.waitForTimeout(500); // Wait for tab to switch
    }
    
    // Fill registration form
    const nameInput = this.page.locator('input[data-testid="input-name-register"]');
    if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nameInput.fill(name || 'Test User');
    }
    
    const emailInput = this.page.locator('input[data-testid="input-email-register"]').first();
    await emailInput.fill(email);
    
    const passwordInput = this.page.locator('input[data-testid="input-password-register"]').first();
    await passwordInput.fill(password);
    
    // Submit registration and wait for navigation simultaneously
    // This ensures we wait for the redirect to complete before proceeding
    const submitButton = this.page.locator('button[data-testid="button-register"]').first();
    
    // Click button and wait for redirect at the same time
    await Promise.all([
      this.page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 30000 }),
      submitButton.click()
    ]);
    
    // Ensure page is loaded
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // Try to find logout button by data-testid first (most reliable)
    const logoutButton = this.page.locator('button[data-testid="button-logout"]').first();
    
    // If not found, try to find by text
    const logoutButtonByText = this.page.locator('button:has-text("Выйти"), button:has-text("Logout")').first();
    
    // Wait for page to be ready
    await this.page.waitForLoadState('networkidle');
    
    // Try data-testid first
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click({ force: true }); // Force click to bypass overlay
    } else if (await logoutButtonByText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButtonByText.click({ force: true });
    } else {
      // Fallback: navigate directly to logout endpoint
      await this.page.goto('/api/auth/logout');
    }
    
    // Wait for redirect to login or home
    await this.page.waitForURL(/\/login|\//, { timeout: 10000 });
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/app/');
  }
}
