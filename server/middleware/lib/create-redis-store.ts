/**
 * Shared Redis store factory for rate limiters
 *
 * Used by rate-limit.ts and rate-limiter.ts
 * Returns undefined if Redis is not available (falls back to in-memory)
 */
import { RedisStore } from 'rate-limit-redis';
import type { RedisReply } from 'rate-limit-redis';
import { getRedisClient } from '../../lib/redis';

export function createRedisStore(prefix: string): RedisStore | undefined {
  const client = getRedisClient();
  if (!client) return undefined;
  return new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      client.call(command, ...args) as Promise<RedisReply>,
    prefix,
  });
}
