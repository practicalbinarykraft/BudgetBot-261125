/**
 * Security Headers Middleware Tests (SEC-05)
 *
 * Tests that HSTS is enabled in production and disabled in development.
 *
 * Strategy:
 * - Use vi.doMock() (not hoisted) + vi.resetModules() + dynamic import to
 *   re-load the middleware with controlled isProduction values per-test.
 * - Static analysis test: verify source uses isProduction (not hardcoded false).
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

/**
 * Helper: build a minimal mock res that helmet can use
 */
function makeMockRes() {
  const headers: Record<string, string> = {};
  return {
    setHeader: vi.fn((name: string, value: string) => {
      headers[name.toLowerCase()] = String(value);
    }),
    getHeader: vi.fn((name: string) => headers[name.toLowerCase()]),
    removeHeader: vi.fn((name: string) => {
      delete headers[name.toLowerCase()];
    }),
    _headers: headers,
  } as unknown as Response & { _headers: Record<string, string> };
}

describe('Security Headers Middleware -- HSTS (SEC-05)', () => {
  it('should set Strict-Transport-Security header in production', async () => {
    // Use vi.doMock (not hoisted) so it applies to the subsequent dynamic import
    vi.doMock('../../lib/env', () => ({
      env: { NODE_ENV: 'production' },
      isProduction: true,
      isDevelopment: false,
      isTest: false,
    }));

    // Dynamically import after mock is set up
    const { securityHeaders } = await import('../security-headers');

    const res = makeMockRes();
    const req = { headers: {} } as Request;
    const next: NextFunction = vi.fn();

    securityHeaders(req, res, next);

    // Assert HSTS header was set in production
    const hstsCallArgs = (res.setHeader as ReturnType<typeof vi.fn>).mock.calls;
    const hstsCall = hstsCallArgs.find(
      ([name]: [string]) => name === 'Strict-Transport-Security'
    );

    expect(hstsCall).toBeDefined();
    expect(hstsCall[1]).toMatch(/max-age=31536000/);
    expect(hstsCall[1]).toMatch(/includeSubDomains/);
  });

  it('should NOT set Strict-Transport-Security header in development', async () => {
    vi.doMock('../../lib/env', () => ({
      env: { NODE_ENV: 'development' },
      isProduction: false,
      isDevelopment: true,
      isTest: false,
    }));

    const { securityHeaders } = await import('../security-headers');

    const res = makeMockRes();
    const req = { headers: {} } as Request;
    const next: NextFunction = vi.fn();

    securityHeaders(req, res, next);

    // HSTS must NOT be set in development
    const hstsCallArgs = (res.setHeader as ReturnType<typeof vi.fn>).mock.calls;
    const hstsWasSet = hstsCallArgs.some(
      ([name]: [string]) => name === 'Strict-Transport-Security'
    );
    expect(hstsWasSet).toBe(false);
  });

  it('source code should use isProduction conditional for HSTS (not hardcoded false)', () => {
    // Static analysis: verify the implementation uses isProduction for HSTS
    const src = readFileSync(
      join(__dirname, '../security-headers.ts'),
      'utf-8'
    );

    // Must NOT have unconditional "hsts: false"
    expect(src).not.toMatch(/^\s*hsts:\s*false,\s*$/m);

    // Must reference isProduction for HSTS configuration
    expect(src).toMatch(/isProduction/);
  });
});
