import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OcrError } from '../ocr-errors';
import type { ParsedReceipt, OcrResult } from '../ocr-provider.types';

vi.mock('../../../lib/logger', () => ({
  logInfo: vi.fn(),
  logWarning: vi.fn(),
  logError: vi.fn(),
}));

const mockRunOcr = vi.fn();

vi.mock('../ocr-orchestrator', () => ({
  runOcr: (...args: unknown[]) => mockRunOcr(...args),
}));

import { parseReceiptWithFallback, isProviderUnavailableError } from '../receipt-ocr-fallback';

const fakeReceipt: ParsedReceipt = {
  total: 100,
  merchant: 'Test Store',
  date: '2025-01-01',
  currency: 'USD',
  items: [{ name: 'Item', normalizedName: 'item', quantity: 1, pricePerUnit: 100, totalPrice: 100 }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('isProviderUnavailableError', () => {
  it('detects credit balance error', () => {
    expect(isProviderUnavailableError(new Error('credit balance is too low'))).toBe(true);
  });

  it('detects rate limit (429)', () => {
    expect(isProviderUnavailableError(new Error('Request failed: 429'))).toBe(true);
  });

  it('detects overloaded', () => {
    expect(isProviderUnavailableError(new Error('API is overloaded'))).toBe(true);
  });

  it('returns false for parse errors', () => {
    expect(isProviderUnavailableError(new Error('Failed to parse Claude response as JSON'))).toBe(false);
  });
});

describe('parseReceiptWithFallback', () => {
  it('returns Anthropic result when it succeeds', async () => {
    const ocrResult: OcrResult = {
      receipt: fakeReceipt,
      provider: 'anthropic',
      providersTried: ['anthropic'],
      latencyMs: 100,
    };
    mockRunOcr.mockResolvedValue(ocrResult);

    const result = await parseReceiptWithFallback(['img'], 'ak', 'ok', 'image/jpeg');

    expect(result).toEqual({
      receipt: fakeReceipt,
      provider: 'anthropic',
      providersTried: ['anthropic'],
      fallbackReason: undefined,
    });
  });

  it('returns OpenAI result on fallback', async () => {
    const ocrResult: OcrResult = {
      receipt: fakeReceipt,
      provider: 'openai',
      providersTried: ['anthropic', 'openai'],
      fallbackReason: 'anthropic: RATE_LIMITED — rate limited',
      latencyMs: 200,
    };
    mockRunOcr.mockResolvedValue(ocrResult);

    const result = await parseReceiptWithFallback(['img'], 'ak', 'ok', 'image/jpeg');

    expect(result.provider).toBe('openai');
    expect(result.providersTried).toEqual(['anthropic', 'openai']);
    expect(result.fallbackReason).toContain('RATE_LIMITED');
  });

  it('does NOT fallback on non-retryable error (bad receipt)', async () => {
    mockRunOcr.mockRejectedValue(new OcrError('Failed to parse response', 'PARSE_FAILED'));

    await expect(
      parseReceiptWithFallback(['img'], 'ak', 'ok', 'image/jpeg')
    ).rejects.toThrow('Failed to parse response');
  });

  it('throws if all providers fail', async () => {
    mockRunOcr.mockRejectedValue(new Error('All OCR providers failed'));

    await expect(
      parseReceiptWithFallback(['img'], 'ak', 'ok', 'image/jpeg')
    ).rejects.toThrow('All OCR providers failed');
  });

  it('passes key resolver that maps provider names to keys', async () => {
    const ocrResult: OcrResult = {
      receipt: fakeReceipt,
      provider: 'anthropic',
      providersTried: ['anthropic'],
      latencyMs: 50,
    };
    mockRunOcr.mockResolvedValue(ocrResult);

    await parseReceiptWithFallback(['img'], 'my-anthro-key', 'my-openai-key', 'image/jpeg');

    // Verify the key resolver was passed correctly
    const getKeyForProvider = mockRunOcr.mock.calls[0][2];
    expect(getKeyForProvider('anthropic')).toBe('my-anthro-key');
    expect(getKeyForProvider('openai')).toBe('my-openai-key');
    expect(getKeyForProvider('unknown')).toBe(null);
  });
});
