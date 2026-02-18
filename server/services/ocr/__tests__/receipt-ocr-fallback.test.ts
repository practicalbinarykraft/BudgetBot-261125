import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseReceiptWithFallback, isProviderUnavailableError } from '../receipt-ocr-fallback';
import type { ParsedReceipt } from '../receipt-parser.service';

vi.mock('../receipt-parser.service', () => ({
  parseReceiptWithItems: vi.fn(),
}));

vi.mock('../openai-receipt-parser.service', () => ({
  parseReceiptWithOpenAI: vi.fn(),
}));

vi.mock('../../../lib/logger', () => ({
  logWarning: vi.fn(),
}));

import { parseReceiptWithItems } from '../receipt-parser.service';
import { parseReceiptWithOpenAI } from '../openai-receipt-parser.service';

const mockAnthropicParse = vi.mocked(parseReceiptWithItems);
const mockOpenAIParse = vi.mocked(parseReceiptWithOpenAI);

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
    mockAnthropicParse.mockResolvedValue(fakeReceipt);

    const result = await parseReceiptWithFallback(['img'], 'ak', 'ok', 'image/jpeg');

    expect(result).toEqual({ receipt: fakeReceipt, provider: 'anthropic' });
    expect(mockOpenAIParse).not.toHaveBeenCalled();
  });

  it('falls back to OpenAI on credit balance error', async () => {
    mockAnthropicParse.mockRejectedValue(new Error('credit balance is too low'));
    mockOpenAIParse.mockResolvedValue(fakeReceipt);

    const result = await parseReceiptWithFallback(['img'], 'ak', 'ok', 'image/jpeg');

    expect(result).toEqual({ receipt: fakeReceipt, provider: 'openai' });
  });

  it('falls back to OpenAI on rate limit (429)', async () => {
    mockAnthropicParse.mockRejectedValue(new Error('Request failed with status 429'));
    mockOpenAIParse.mockResolvedValue(fakeReceipt);

    const result = await parseReceiptWithFallback(['img'], 'ak', 'ok', 'image/jpeg');

    expect(result).toEqual({ receipt: fakeReceipt, provider: 'openai' });
  });

  it('does NOT fallback on parse error (bad receipt)', async () => {
    const parseError = new Error('Failed to parse Claude response as JSON. Response: ...');
    mockAnthropicParse.mockRejectedValue(parseError);

    await expect(
      parseReceiptWithFallback(['img'], 'ak', 'ok', 'image/jpeg')
    ).rejects.toThrow('Failed to parse Claude response');

    expect(mockOpenAIParse).not.toHaveBeenCalled();
  });

  it('throws if both providers fail', async () => {
    mockAnthropicParse.mockRejectedValue(new Error('credit balance is too low'));
    mockOpenAIParse.mockRejectedValue(new Error('OpenAI also failed'));

    await expect(
      parseReceiptWithFallback(['img'], 'ak', 'ok', 'image/jpeg')
    ).rejects.toThrow('OpenAI also failed');
  });
});
