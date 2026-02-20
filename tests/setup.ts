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

// Используем реальную БД из .env, если она доступна
// Если DATABASE_URL уже установлен (из .env), используем его
// Иначе пытаемся загрузить из .env файла
if (!process.env.DATABASE_URL) {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const dbUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
      if (dbUrlMatch) {
        process.env.DATABASE_URL = dbUrlMatch[1].trim();
        console.log('[Test Setup] Loaded DATABASE_URL from .env file');
      }
    }
  } catch (error) {
    // Если не удалось загрузить, используем тестовую БД
    console.warn('[Test Setup] Could not load DATABASE_URL from .env, using test DB');
  }
}

// Если все еще не установлено, используем тестовую БД
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
}

process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-must-be-32-chars!!';
process.env.PASSWORD_RESET_SECRET = process.env.PASSWORD_RESET_SECRET || 'test-password-reset-secret-32-chars!!';
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'U4rnuZd9jFqJb5yokp5e1DrI8QCmSZx8HpDX4lLZUqI=';

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
