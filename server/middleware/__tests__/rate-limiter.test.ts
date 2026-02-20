import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { apiLimiter, authLimiter, aiLimiter } from '../rate-limiter';

describe('Rate Limiters (rate-limiter.ts)', () => {
  describe('apiLimiter', () => {
    it('should be defined and be a function (middleware)', () => {
      expect(apiLimiter).toBeDefined();
      expect(typeof apiLimiter).toBe('function');
    });
  });

  describe('authLimiter', () => {
    it('should be defined and be a function (middleware)', () => {
      expect(authLimiter).toBeDefined();
      expect(typeof authLimiter).toBe('function');
    });
  });

  describe('aiLimiter', () => {
    it('should be defined and be a function (middleware)', () => {
      expect(aiLimiter).toBeDefined();
      expect(typeof aiLimiter).toBe('function');
    });
  });

  describe('All rate limiters', () => {
    it('should export all three rate limiters', () => {
      expect(apiLimiter).toBeDefined();
      expect(authLimiter).toBeDefined();
      expect(aiLimiter).toBeDefined();
    });

    it('should all be functions (middleware)', () => {
      expect(typeof apiLimiter).toBe('function');
      expect(typeof authLimiter).toBe('function');
      expect(typeof aiLimiter).toBe('function');
    });
  });
});

describe('Redis Store Integration', () => {
  it('rate-limiter.ts should import createRedisStore from shared module', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../rate-limiter.ts'), 'utf-8'
    );
    // Must import from shared module, NOT define locally
    expect(source).toContain("from './lib/create-redis-store'");
    expect(source).not.toContain('function createRedisStore');
  });

  it('rate-limiter.ts should use createRedisStore for each limiter', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../rate-limiter.ts'), 'utf-8'
    );
    expect(source).toContain("createRedisStore('rl:api:");
    expect(source).toContain("createRedisStore('rl:auth2:");
    expect(source).toContain("createRedisStore('rl:ai2:");
  });
});
