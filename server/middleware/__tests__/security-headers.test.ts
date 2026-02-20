/**
 * Security Headers Middleware Tests (SEC-05)
 *
 * Tests that HSTS is enabled in production and disabled in development.
 *
 * Strategy:
 * - Use vi.resetModules() + dynamic import to re-load the module with a fresh
 *   mock of '../lib/env' so isProduction can be controlled per-test.
 * - Helmet sets headers via res.setHeader(); we spy on that to assert HSTS.
 * - Static analysis test: verify source uses isProduction (not hardcoded false).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Security Headers Middleware -- HSTS (SEC-05)', () => {
  beforeEach(() => {
    // Reset module registry so each test gets a fresh import
    vi.resetModules();
  });

  it('should set Strict-Transport-Security header in production', async () => {
    // Mock env module so isProduction === true
    vi.mock('../../lib/env', () => ({
      env: { NODE_ENV: 'production' },
      isProduction: true,
      isDevelopment: false,
      isTest: false,
    }));

    // Dynamically import after mock is set up
    const { securityHeaders } = await import('../security-headers');

    // Create a realistic mock res that helmet needs
    const headers: Record<string, string> = {};
    const req = { headers: {} } as Request;
    const res = {
      setHeader: vi.fn((name: string, value: string) => {
        headers[name.toLowerCase()] = value;
      }),
      getHeader: vi.fn((name: string) => headers[name.toLowerCase()]),
      removeHeader: vi.fn((name: string) => {
        delete headers[name.toLowerCase()];
      }),
    } as unknown as Response;
    const next: NextFunction = vi.fn();

    // Call middleware
    securityHeaders(req, res, next);

    // Assert HSTS header was set
    expect(res.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.stringContaining('max-age=')
    );
  });

  it('should NOT set Strict-Transport-Security header in development', async () => {
    // Mock env module so isProduction === false
    vi.mock('../../lib/env', () => ({
      env: { NODE_ENV: 'development' },
      isProduction: false,
      isDevelopment: true,
      isTest: false,
    }));

    const { securityHeaders } = await import('../security-headers');

    const headers: Record<string, string> = {};
    const req = { headers: {} } as Request;
    const res = {
      setHeader: vi.fn((name: string, value: string) => {
        headers[name.toLowerCase()] = value;
      }),
      getHeader: vi.fn((name: string) => headers[name.toLowerCase()]),
      removeHeader: vi.fn((name: string) => {
        delete headers[name.toLowerCase()];
      }),
    } as unknown as Response;
    const next: NextFunction = vi.fn();

    securityHeaders(req, res, next);

    // HSTS must NOT be set in development
    const hstsCallArgs = (res.setHeader as ReturnType<typeof vi.fn>).mock.calls;
    const hstsWasSet = hstsCallArgs.some(
      ([name]: [string]) => name.toLowerCase() === 'strict-transport-security'
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
