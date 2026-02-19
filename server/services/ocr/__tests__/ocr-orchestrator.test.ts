import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OcrError } from '../ocr-errors';
import { registerProvider, clearRegistry } from '../ocr-registry';
import { runOcr } from '../ocr-orchestrator';
import type { OcrProvider, ImageInput, ParsedReceipt } from '../ocr-provider.types';

vi.mock('../../../lib/logger', () => ({
  logInfo: vi.fn(),
  logWarning: vi.fn(),
  logError: vi.fn(),
}));

const fakeReceipt: ParsedReceipt = {
  total: 100,
  merchant: 'Test Store',
  date: '2025-01-01',
  currency: 'USD',
  items: [{ name: 'Item', normalizedName: 'item', quantity: 1, pricePerUnit: 100, totalPrice: 100 }],
};

const fakeImages: ImageInput[] = [{ base64: 'abc', mimeType: 'image/jpeg' }];

function makeProvider(name: string, overrides?: Partial<OcrProvider>): OcrProvider {
  return {
    name,
    billingProvider: 'anthropic',
    isAvailable: () => true,
    parseReceipt: vi.fn().mockResolvedValue(fakeReceipt),
    ...overrides,
  };
}

const originalEnv = process.env.OCR_PROVIDER_ORDER;

beforeEach(() => {
  vi.clearAllMocks();
  clearRegistry();
  delete process.env.OCR_PROVIDER_ORDER;
});

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.OCR_PROVIDER_ORDER;
  } else {
    process.env.OCR_PROVIDER_ORDER = originalEnv;
  }
});

describe('runOcr', () => {
  it('uses first provider when it succeeds', async () => {
    const p1 = makeProvider('anthropic');
    const p2 = makeProvider('openai');
    registerProvider(p1);
    registerProvider(p2);

    const result = await runOcr(fakeImages, 'image/jpeg', () => 'key');

    expect(result.provider).toBe('anthropic');
    expect(result.providersTried).toEqual(['anthropic']);
    expect(result.receipt).toEqual(fakeReceipt);
    expect(p2.parseReceipt).not.toHaveBeenCalled();
  });

  it('falls back to second provider on retryable error', async () => {
    const p1 = makeProvider('anthropic', {
      parseReceipt: vi.fn().mockRejectedValue(new OcrError('rate limited', 'RATE_LIMITED')),
    });
    const p2 = makeProvider('openai');
    registerProvider(p1);
    registerProvider(p2);

    const result = await runOcr(fakeImages, 'image/jpeg', () => 'key');

    expect(result.provider).toBe('openai');
    expect(result.providersTried).toEqual(['anthropic', 'openai']);
    expect(result.fallbackReason).toContain('RATE_LIMITED');
  });

  it('stops on non-retryable error (PARSE_FAILED)', async () => {
    const p1 = makeProvider('anthropic', {
      parseReceipt: vi.fn().mockRejectedValue(new OcrError('bad json', 'PARSE_FAILED')),
    });
    const p2 = makeProvider('openai');
    registerProvider(p1);
    registerProvider(p2);

    await expect(runOcr(fakeImages, 'image/jpeg', () => 'key')).rejects.toThrow('bad json');
    expect(p2.parseReceipt).not.toHaveBeenCalled();
  });

  it('skips providers with no key', async () => {
    const p1 = makeProvider('anthropic');
    const p2 = makeProvider('openai');
    registerProvider(p1);
    registerProvider(p2);

    const getKey = (name: string) => name === 'openai' ? 'key' : null;
    const result = await runOcr(fakeImages, 'image/jpeg', getKey);

    expect(result.provider).toBe('openai');
    expect(result.providersTried).toEqual(['openai']);
    expect(p1.parseReceipt).not.toHaveBeenCalled();
  });

  it('skips unavailable providers', async () => {
    const p1 = makeProvider('anthropic', { isAvailable: () => false });
    const p2 = makeProvider('openai');
    registerProvider(p1);
    registerProvider(p2);

    const result = await runOcr(fakeImages, 'image/jpeg', () => 'key');

    expect(result.provider).toBe('openai');
    expect(p1.parseReceipt).not.toHaveBeenCalled();
  });

  it('respects OCR_PROVIDER_ORDER env var', async () => {
    process.env.OCR_PROVIDER_ORDER = 'openai,anthropic';

    const p1 = makeProvider('anthropic');
    const p2 = makeProvider('openai');
    registerProvider(p1);
    registerProvider(p2);

    const result = await runOcr(fakeImages, 'image/jpeg', () => 'key');

    expect(result.provider).toBe('openai');
    expect(p1.parseReceipt).not.toHaveBeenCalled();
  });

  it('throws when no providers have keys', async () => {
    const p1 = makeProvider('anthropic');
    registerProvider(p1);

    await expect(runOcr(fakeImages, 'image/jpeg', () => null)).rejects.toThrow(
      'No OCR providers available'
    );
  });

  it('throws last error when all providers fail', async () => {
    const p1 = makeProvider('anthropic', {
      parseReceipt: vi.fn().mockRejectedValue(new OcrError('p1 down', 'PROVIDER_DOWN')),
    });
    const p2 = makeProvider('openai', {
      parseReceipt: vi.fn().mockRejectedValue(new OcrError('p2 down', 'PROVIDER_DOWN')),
    });
    registerProvider(p1);
    registerProvider(p2);

    await expect(runOcr(fakeImages, 'image/jpeg', () => 'key')).rejects.toThrow('p2 down');
  });

  it('includes latencyMs in result', async () => {
    const p1 = makeProvider('anthropic');
    registerProvider(p1);

    const result = await runOcr(fakeImages, 'image/jpeg', () => 'key');

    expect(typeof result.latencyMs).toBe('number');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });
});
