import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies BEFORE imports
vi.mock('../../db', () => ({ db: { execute: vi.fn() } }));
vi.mock('../../lib/redis', () => ({
  isRedisAvailable: vi.fn(),
  cache: { getStats: vi.fn() },
}));
vi.mock('../../lib/metrics', () => ({ metrics: { getAll: vi.fn(() => ({})) } }));
vi.mock('../../lib/alerts', () => ({ getAlertStatus: vi.fn(() => ({ healthy: true })) }));

const mockGetProviderOrder = vi.fn<() => string[]>();
const mockGetProviderNames = vi.fn<() => string[]>();
const mockGetProvider = vi.fn();
vi.mock('../../services/ocr/ocr-registry', () => ({
  getProviderOrder: (...args: unknown[]) => mockGetProviderOrder(...(args as [])),
  getProviderNames: (...args: unknown[]) => mockGetProviderNames(...(args as [])),
  getProvider: (...args: unknown[]) => mockGetProvider(...(args as [])),
}));

const mockGetSystemKey = vi.fn();
vi.mock('../../services/api-key-manager', () => ({
  getSystemKey: (...args: unknown[]) => mockGetSystemKey(...(args as [])),
}));

import express from 'express';
import request from 'supertest';
import healthRouter from '../health.routes';

function makeProvider(name: string, available = true) {
  return { name, billingProvider: name, isAvailable: () => available, parseReceipt: vi.fn() };
}

describe('/api/health/ocr', () => {
  const app = express();
  app.use('/api', healthRouter);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ok when providers registered + system keys exist', async () => {
    mockGetProviderOrder.mockReturnValue(['anthropic', 'openai']);
    mockGetProviderNames.mockReturnValue(['anthropic', 'openai']);
    mockGetProvider.mockImplementation((name: string) => makeProvider(name));
    mockGetSystemKey.mockReturnValue('sk-test-key');

    const res = await request(app).get('/api/health/ocr');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.providersAvailable).toBe(2);
    expect(res.body.providersWithKeys).toBe(2);
    expect(res.body.providers[0]).toMatchObject({
      name: 'anthropic',
      registered: true,
      available: true,
      hasSystemKey: true,
    });
  });

  it('returns degraded (200) when providers exist but no system keys', async () => {
    mockGetProviderOrder.mockReturnValue(['anthropic', 'openai']);
    mockGetProviderNames.mockReturnValue(['anthropic', 'openai']);
    mockGetProvider.mockImplementation((name: string) => makeProvider(name));
    mockGetSystemKey.mockImplementation(() => { throw new Error('No key'); });

    const res = await request(app).get('/api/health/ocr');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('degraded');
    expect(res.body.providersAvailable).toBe(2);
    expect(res.body.providersWithKeys).toBe(0);
  });

  it('returns down (503) when no providers registered', async () => {
    mockGetProviderOrder.mockReturnValue(['anthropic', 'openai']);
    mockGetProviderNames.mockReturnValue([]);
    mockGetProvider.mockReturnValue(undefined);
    mockGetSystemKey.mockImplementation(() => { throw new Error('No key'); });

    const res = await request(app).get('/api/health/ocr');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('down');
    expect(res.body.providersAvailable).toBe(0);
  });

  it('returns down (503) when provider order is empty', async () => {
    mockGetProviderOrder.mockReturnValue([]);
    mockGetProviderNames.mockReturnValue(['anthropic']);
    mockGetSystemKey.mockReturnValue('sk-test');

    const res = await request(app).get('/api/health/ocr');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('down');
    expect(res.body.providers).toEqual([]);
  });

  it('mixed: one provider has key, other does not', async () => {
    mockGetProviderOrder.mockReturnValue(['anthropic', 'openai']);
    mockGetProviderNames.mockReturnValue(['anthropic', 'openai']);
    mockGetProvider.mockImplementation((name: string) => makeProvider(name));
    mockGetSystemKey.mockImplementation((name: string) => {
      if (name === 'anthropic') return 'sk-ant-key';
      throw new Error('No key');
    });

    const res = await request(app).get('/api/health/ocr');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.providersWithKeys).toBe(1);
    expect(res.body.providers[0].hasSystemKey).toBe(true);
    expect(res.body.providers[1].hasSystemKey).toBe(false);
  });

  it('never leaks actual key values', async () => {
    mockGetProviderOrder.mockReturnValue(['anthropic']);
    mockGetProviderNames.mockReturnValue(['anthropic']);
    mockGetProvider.mockImplementation((name: string) => makeProvider(name));
    mockGetSystemKey.mockReturnValue('sk-ant-secret-key-12345');

    const res = await request(app).get('/api/health/ocr');
    const body = JSON.stringify(res.body);

    expect(body).not.toContain('sk-ant-secret');
    expect(body).not.toContain('12345');
    expect(res.body.providers[0].hasSystemKey).toBe(true);
  });
});
