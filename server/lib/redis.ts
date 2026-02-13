/**
 * Redis Cache Module
 *
 * Provides Redis connection and caching utilities for the application.
 * Features:
 * - Connection pooling
 * - Automatic reconnection
 * - TTL support
 * - JSON serialization
 * - Error handling
 * - Graceful shutdown
 */

import Redis from 'ioredis';
import logger from './logger';

// Redis configuration
const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
};

// Default TTL values (in seconds)
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 1800,          // 30 minutes
  VERY_LONG: 3600,     // 1 hour
  DAY: 86400,          // 24 hours
} as const;

let redisClient: Redis | null = null;

/**
 * Check if Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!(process.env.REDIS_URL || process.env.REDIS_HOST);
}

/**
 * Initialize Redis connection
 * Returns null if Redis is not configured
 */
export function initRedis(): Redis | null {
  // Skip Redis initialization if not configured
  if (!isRedisConfigured()) {
    logger.info('Redis: Not configured, skipping initialization');
    return null;
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    // Use REDIS_URL if available, otherwise use individual config
    const connectionConfig = process.env.REDIS_URL
      ? process.env.REDIS_URL
      : REDIS_CONFIG;

    redisClient = new Redis(connectionConfig as any);

    redisClient.on('connect', () => {
      logger.info('Redis: Connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('Redis: Ready to accept commands');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis: Connection error', { error: err.message });
    });

    redisClient.on('close', () => {
      logger.warn('Redis: Connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis: Reconnecting...');
    });

    return redisClient;
  } catch (error) {
    logger.error('Redis: Failed to initialize', { error });
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Check if Redis is connected and available
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (!redisClient) {
    return false;
  }

  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.warn('Redis: Not available', { error });
    return false;
  }
}

/**
 * Cache wrapper with automatic JSON serialization
 */
export class CacheService {
  private client: Redis | null;

  constructor() {
    this.client = getRedisClient();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !(await isRedisAvailable())) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis: Get failed', { key, error });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttl: number = CACHE_TTL.MEDIUM): Promise<boolean> {
    if (!this.client || !(await isRedisAvailable())) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error('Redis: Set failed', { key, error });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string | string[]): Promise<boolean> {
    if (!this.client || !(await isRedisAvailable())) {
      return false;
    }

    try {
      const keys = Array.isArray(key) ? key : [key];
      await this.client.del(...keys);
      return true;
    } catch (error) {
      logger.error('Redis: Delete failed', { key, error });
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern using SCAN (production-safe).
   * Unlike KEYS, SCAN doesn't block Redis on large datasets.
   */
  async delPattern(pattern: string): Promise<boolean> {
    if (!this.client || !(await isRedisAvailable())) {
      return false;
    }

    try {
      const stream = this.client.scanStream({ match: pattern, count: 100 });
      const allKeys: string[] = [];
      await new Promise<void>((resolve, reject) => {
        stream.on('data', (keys: string[]) => {
          allKeys.push(...keys);
        });
        stream.on('end', resolve);
        stream.on('error', reject);
      });
      if (allKeys.length > 0) {
        await this.client.del(...allKeys);
      }
      return true;
    } catch (error) {
      logger.error('Redis: Delete pattern failed', { pattern, error });
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client || !(await isRedisAvailable())) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis: Exists check failed', { key, error });
      return false;
    }
  }

  /**
   * Get TTL of a key
   */
  async ttl(key: string): Promise<number> {
    if (!this.client || !(await isRedisAvailable())) {
      return -2;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis: TTL check failed', { key, error });
      return -2;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    if (!this.client || !(await isRedisAvailable())) {
      return false;
    }

    try {
      await this.client.flushdb();
      logger.info('Redis: Cache cleared');
      return true;
    } catch (error) {
      logger.error('Redis: Clear failed', { error });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    keys: number;
    memory: string;
    uptime: number;
  }> {
    if (!this.client || !(await isRedisAvailable())) {
      return {
        connected: false,
        keys: 0,
        memory: '0',
        uptime: 0,
      };
    }

    try {
      const info = await this.client.info('server');
      const keyspace = await this.client.info('keyspace');
      const dbsize = await this.client.dbsize();

      // Parse uptime from info
      const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);
      const uptime = uptimeMatch ? parseInt(uptimeMatch[1], 10) : 0;

      // Parse memory from info
      const memoryMatch = info.match(/used_memory_human:(.*?)\r/);
      const memory = memoryMatch ? memoryMatch[1] : '0';

      return {
        connected: true,
        keys: dbsize,
        memory,
        uptime,
      };
    } catch (error) {
      logger.error('Redis: Stats failed', { error });
      return {
        connected: false,
        keys: 0,
        memory: '0',
        uptime: 0,
      };
    }
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis: Connection closed gracefully');
    } catch (error) {
      logger.error('Redis: Error closing connection', { error });
    }
  }
}

// Export singleton cache service instance
export const cache = new CacheService();
