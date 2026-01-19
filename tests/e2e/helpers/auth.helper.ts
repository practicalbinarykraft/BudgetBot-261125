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
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
  }

  /**
   * Click login button
   */
  async clickLoginButton(): Promise<void> {
    await this.page.click('button:has-text("Войти"), button:has-text("Login")');
  }

  /**
   * Complete login flow
   */
  async login(email: string, password: string): Promise<void> {
    await this.gotoLogin();
    await this.fillLoginForm(email, password);
    await this.clickLoginButton();
    
    // Wait for redirect to dashboard
    await this.page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 10000 });
  }

  /**
   * Register new user
   */
  async register(email: string, password: string, confirmPassword?: string): Promise<void> {
    await this.page.goto('/login');
    
    // Switch to registration tab if exists
    const registerTab = this.page.locator('button:has-text("Регистрация"), button:has-text("Register")');
    if (await registerTab.isVisible()) {
      await registerTab.click();
    }
    
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    
    if (confirmPassword) {
      const confirmInput = this.page.locator('input[type="password"]').nth(1);
      await confirmInput.fill(confirmPassword);
    }
    
    await this.page.click('button:has-text("Зарегистрироваться"), button:has-text("Sign up")');
    
    // Wait for redirect
    await this.page.waitForURL(/\/app\/(dashboard|dashboard-v2)/, { timeout: 10000 });
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    // Try to find logout button in mobile menu or sidebar
    const mobileMenuButton = this.page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
    const logoutButton = this.page.locator('button:has-text("Выйти"), button:has-text("Logout")');
    
    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();
      await this.page.waitForTimeout(500); // Wait for menu to open
    }
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Try to find logout in dropdown menu
      const userMenu = this.page.locator('[data-testid="user-menu"], button:has-text("Вы вошли как")');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await this.page.waitForTimeout(500);
        await logoutButton.click();
      }
    }
    
    // Wait for redirect to login
    await this.page.waitForURL(/\/login|\//, { timeout: 5000 });
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/app/');
  }
}
