import { Page, expect } from '@playwright/test';

/**
 * Page Helper Functions
 * 
 * FOR JUNIORS: Common page interactions and assertions.
 * These helpers make tests more readable and maintainable.
 * 
 * Usage:
 *   const pageHelper = new PageHelper(page);
 *   await pageHelper.waitForPageLoad();
 */
export class PageHelper {
  constructor(private page: Page) {}

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(selector: string, timeout = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    try {
      return await this.page.locator(selector).isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Click element safely (wait for it to be visible first)
   */
  async clickSafe(selector: string): Promise<void> {
    await this.waitForVisible(selector);
    await this.page.click(selector);
  }

  /**
   * Fill input safely
   */
  async fillSafe(selector: string, value: string): Promise<void> {
    await this.waitForVisible(selector);
    await this.page.fill(selector, value);
  }

  /**
   * Check if URL matches pattern
   */
  async urlMatches(pattern: string | RegExp): Promise<boolean> {
    const url = this.page.url();
    if (typeof pattern === 'string') {
      return url.includes(pattern);
    }
    return pattern.test(url);
  }

  /**
   * Wait for URL to match pattern
   */
  async waitForUrl(pattern: string | RegExp, timeout = 10000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Take screenshot with name
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `tests/e2e/screenshots/${name}.png`, fullPage: true });
  }

  /**
   * Check if toast notification appears
   */
  async waitForToast(message?: string, timeout = 5000): Promise<void> {
    const toastSelector = '[role="status"], [data-testid="toast"]';
    await this.page.waitForSelector(toastSelector, { timeout });
    
    if (message) {
      await expect(this.page.locator(toastSelector)).toContainText(message);
    }
  }

  /**
   * Check if error message appears
   */
  async hasError(message: string): Promise<boolean> {
    const errorSelectors = [
      `text=${message}`,
      '[role="alert"]',
      '.error',
      '[data-testid="error"]',
    ];
    
    for (const selector of errorSelectors) {
      try {
        const element = this.page.locator(selector);
        if (await element.isVisible({ timeout: 1000 })) {
          return true;
        }
      } catch {
        // Continue to next selector
      }
    }
    
    return false;
  }

  /**
   * Wait for API request to complete
   */
  async waitForApiResponse(urlPattern: string | RegExp, timeout = 10000): Promise<void> {
    await this.page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === 'string') {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout }
    );
  }
}
