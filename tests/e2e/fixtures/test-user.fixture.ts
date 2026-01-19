/**
 * Test User Fixtures
 * 
 * FOR JUNIORS: Fixtures are reusable test data.
 * Instead of creating the same test user in every test, we define it once here.
 * 
 * Usage:
 *   import { TEST_USER } from './fixtures/test-user.fixture';
 *   await authHelper.login(TEST_USER.email, TEST_USER.password);
 */

export interface TestUser {
  email: string;
  password: string;
  name?: string;
}

/**
 * Default test user for E2E tests
 */
export const TEST_USER: TestUser = {
  email: `e2e-test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'E2E Test User',
};

/**
 * Generate unique test user email
 */
export function generateTestUserEmail(prefix = 'e2e'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Create test user object with unique email
 */
export function createTestUser(prefix = 'e2e'): TestUser {
  return {
    email: generateTestUserEmail(prefix),
    password: 'TestPassword123!',
    name: `Test User ${prefix}`,
  };
}
