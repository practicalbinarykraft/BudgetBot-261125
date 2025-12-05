/**
 * Global test setup for Vitest
 *
 * This file runs before all tests.
 * Add global mocks and setup here.
 */

import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.SESSION_SECRET = 'test-session-secret-must-be-32-chars!!';
process.env.ENCRYPTION_KEY = 'U4rnuZd9jFqJb5yokp5e1DrI8QCmSZx8HpDX4lLZUqI=';

// Mock localStorage for frontend tests
const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
};

// Only set if window exists (frontend tests)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
}

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
