import { beforeAll, afterAll, afterEach } from 'vitest';

// Setup environment variables for tests
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/budgetbot_test';
  process.env.SESSION_SECRET = 'test-secret-key-for-testing-only';
  process.env.ENCRYPTION_KEY = 'U4rnuZd9jFqJb5yokp5e1DrI8QCmSZx8HpDX4lLZUqI='; // Valid base64 key for AES-256
  process.env.REDIS_ENABLED = 'false'; // Disable Redis for tests
});

// Cleanup after each test
afterEach(() => {
  // Reset mocks if needed
});

// Cleanup after all tests
afterAll(() => {
  // Close connections if needed
});
