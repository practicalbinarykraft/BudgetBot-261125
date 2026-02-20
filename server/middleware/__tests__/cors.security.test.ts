/**
 * CORS Security Tests (SEC-06, SEC-07)
 *
 * SEC-06: localhost:5000 must NOT be in ALLOWED_ORIGINS (any environment)
 * SEC-07: Socket.IO CORS must use the same ALLOWED_ORIGINS as Express CORS
 *
 * Strategy for SEC-06:
 * - Use vi.resetModules() + dynamic import with NODE_ENV=development to test
 *   that localhost:5000 is not pushed to the development origins list.
 *
 * Strategy for SEC-07:
 * - Static analysis: read websocket.ts source and verify it imports
 *   ALLOWED_ORIGINS from '../middleware/cors' and uses it.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CORS Origins Security (SEC-06)', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.resetModules();
  });

  it('ALLOWED_ORIGINS should NOT contain localhost:5000 in development', async () => {
    // Set environment to development
    process.env.NODE_ENV = 'development';

    // Dynamically import cors.ts with fresh module state
    const { ALLOWED_ORIGINS } = await import('../cors');

    expect(ALLOWED_ORIGINS).not.toContain('http://localhost:5000');
  });

  it('ALLOWED_ORIGINS should NOT contain localhost:5000 in production', async () => {
    process.env.NODE_ENV = 'production';

    const { ALLOWED_ORIGINS } = await import('../cors');

    expect(ALLOWED_ORIGINS).not.toContain('http://localhost:5000');
  });

  it('ALLOWED_ORIGINS should contain legitimate production origins', async () => {
    process.env.NODE_ENV = 'production';

    const { ALLOWED_ORIGINS } = await import('../cors');

    expect(ALLOWED_ORIGINS).toContain('https://budgetbot.online');
    expect(ALLOWED_ORIGINS).toContain('https://m.budgetbot.online');
  });

  it('ALLOWED_ORIGINS should contain legitimate dev origins in development', async () => {
    process.env.NODE_ENV = 'development';

    const { ALLOWED_ORIGINS } = await import('../cors');

    // These are actual dev client ports (not the API server)
    expect(ALLOWED_ORIGINS).toContain('http://localhost:8081');
    expect(ALLOWED_ORIGINS).toContain('http://localhost:19006');
    expect(ALLOWED_ORIGINS).toContain('http://localhost:3000');
  });
});

describe('Socket.IO CORS Sync (SEC-07)', () => {
  it('websocket.ts should import ALLOWED_ORIGINS from cors middleware', () => {
    // Static analysis: verify websocket.ts uses the shared ALLOWED_ORIGINS
    const websocketSrc = readFileSync(
      join(import.meta.dirname ?? __dirname, '../../lib/websocket.ts'),
      'utf-8'
    );

    // Must import ALLOWED_ORIGINS from the cors middleware
    expect(websocketSrc).toMatch(
      /import\s*\{[^}]*ALLOWED_ORIGINS[^}]*\}\s*from\s*['"]\.\.\/middleware\/cors['"]/
    );
  });

  it('websocket.ts should use ALLOWED_ORIGINS for Socket.IO cors.origin', () => {
    const websocketSrc = readFileSync(
      join(import.meta.dirname ?? __dirname, '../../lib/websocket.ts'),
      'utf-8'
    );

    // Must pass ALLOWED_ORIGINS as the cors origin for Socket.IO
    expect(websocketSrc).toMatch(/origin\s*:\s*ALLOWED_ORIGINS/);
  });

  it('websocket.ts should NOT define a separate hardcoded origins list', () => {
    const websocketSrc = readFileSync(
      join(import.meta.dirname ?? __dirname, '../../lib/websocket.ts'),
      'utf-8'
    );

    // Should not contain its own array literal for origins
    // (it must reuse ALLOWED_ORIGINS from cors.ts, not define its own list)
    expect(websocketSrc).not.toMatch(/origin\s*:\s*\[/);
  });
});
