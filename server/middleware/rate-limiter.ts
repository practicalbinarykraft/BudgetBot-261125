/**
 * Rate Limiter Middleware
 *
 * Protects API from abuse and brute-force attacks.
 * Junior-Friendly: ~40 lines, single responsibility
 *
 * Limits:
 * - General API: 100 requests per minute
 * - Auth endpoints: 5 requests per minute (stricter)
 * - AI endpoints: 10 requests per minute (expensive)
 */

import rateLimit from 'express-rate-limit';
import { createRedisStore } from './lib/create-redis-store';

/**
 * General API rate limiter
 * 100 requests per minute per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
  store: createRedisStore('rl:api:'), // Redis store for persistence across restarts
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  },
});

/**
 * Strict rate limiter for auth endpoints
 * 5 requests per minute per IP (prevents brute-force)
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:auth2:'), // Redis store for persistence across restarts
});

/**
 * Rate limiter for AI endpoints (expensive operations)
 * 10 requests per minute per IP
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'Too many AI requests, please try again later.',
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('rl:ai2:'), // Redis store for persistence across restarts
});
