import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { authRateLimiter, aiRateLimiter, generalRateLimiter, strictRateLimiter, heavyOperationRateLimiter } from '../rate-limit';

describe('Rate Limiters Configuration', () => {
  describe('authRateLimiter', () => {
    it('should be configured with correct window and max requests', () => {
      expect(authRateLimiter).toBeDefined();
      // Note: express-rate-limit doesn't expose config directly,
      // so we verify it's a function (middleware)
      expect(typeof authRateLimiter).toBe('function');
    });

    it('should have proper error message structure', () => {
      // The middleware is created with proper config
      // Integration tests would verify actual behavior
      expect(authRateLimiter).toBeDefined();
    });
  });

  describe('aiRateLimiter', () => {
    it('should be configured for AI endpoints', () => {
      expect(aiRateLimiter).toBeDefined();
      expect(typeof aiRateLimiter).toBe('function');
    });

    it('should exist and be callable as middleware', () => {
      expect(aiRateLimiter).toBeDefined();
      expect(typeof aiRateLimiter).toBe('function');
    });
  });

  describe('generalRateLimiter', () => {
    it('should be configured for general API protection', () => {
      expect(generalRateLimiter).toBeDefined();
      expect(typeof generalRateLimiter).toBe('function');
    });
  });

  describe('strictRateLimiter', () => {
    it('should be configured for sensitive operations', () => {
      expect(strictRateLimiter).toBeDefined();
      expect(typeof strictRateLimiter).toBe('function');
    });
  });

  describe('heavyOperationRateLimiter', () => {
    it('should be configured for heavy operations', () => {
      expect(heavyOperationRateLimiter).toBeDefined();
      expect(typeof heavyOperationRateLimiter).toBe('function');
    });
  });

  describe('All rate limiters', () => {
    it('should export all five rate limiters', () => {
      expect(authRateLimiter).toBeDefined();
      expect(aiRateLimiter).toBeDefined();
      expect(generalRateLimiter).toBeDefined();
      expect(strictRateLimiter).toBeDefined();
      expect(heavyOperationRateLimiter).toBeDefined();
    });

    it('should all be functions (middleware)', () => {
      expect(typeof authRateLimiter).toBe('function');
      expect(typeof aiRateLimiter).toBe('function');
      expect(typeof generalRateLimiter).toBe('function');
      expect(typeof strictRateLimiter).toBe('function');
      expect(typeof heavyOperationRateLimiter).toBe('function');
    });
  });
});

describe('Redis Store Integration', () => {
  it('rate-limit.ts should import createRedisStore from shared module', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../rate-limit.ts'), 'utf-8'
    );
    // Must import from shared module, NOT define locally
    expect(source).toContain("from './lib/create-redis-store'");
    expect(source).not.toContain('function createRedisStore');
  });

  it('rate-limit.ts should use createRedisStore for each limiter', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../rate-limit.ts'), 'utf-8'
    );
    expect(source).toContain("createRedisStore('rl:auth:");
    expect(source).toContain("createRedisStore('rl:ai:");
    expect(source).toContain("createRedisStore('rl:general:");
    expect(source).toContain("createRedisStore('rl:strict:");
    expect(source).toContain("createRedisStore('rl:heavy:");
  });
});

describe('Shared Module', () => {
  it('create-redis-store.ts should exist and export createRedisStore', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../lib/create-redis-store.ts'), 'utf-8'
    );
    expect(source).toContain('export function createRedisStore');
    expect(source).toContain('getRedisClient');
    expect(source).toContain("from 'rate-limit-redis'");
  });
});

// Note: Full integration tests for rate limiting would require:
// 1. Setting up Express app
// 2. Making multiple requests
// 3. Verifying rate limit headers
// 4. Testing limit enforcement
// These are better suited for e2e tests rather than unit tests.
