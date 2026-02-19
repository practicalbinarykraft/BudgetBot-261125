import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OcrError } from '../ocr-errors';

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(function () {
    return { messages: { create: mockCreate } };
  }),
}));

vi.mock('../../../lib/logger', () => ({
  logError: vi.fn(),
  logWarning: vi.fn(),
  logInfo: vi.fn(),
}));

import { anthropicOcrProvider } from '../anthropic-ocr-provider';
import type { ImageInput } from '../ocr-provider.types';

const fakeImages: ImageInput[] = [{ base64: 'abc', mimeType: 'image/jpeg' }];

const validReceipt = {
  total: 100,
  merchant: 'Test Store',
  date: '2025-01-01',
  currency: 'USD',
  items: [{ name: 'Item', quantity: 1, pricePerUnit: 100, totalPrice: 100 }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('anthropicOcrProvider', () => {
  it('has correct name and billingProvider', () => {
    expect(anthropicOcrProvider.name).toBe('anthropic');
    expect(anthropicOcrProvider.billingProvider).toBe('anthropic');
  });

  it('isAvailable returns true when SDK is installed', () => {
    expect(anthropicOcrProvider.isAvailable()).toBe(true);
  });

  it('parses receipt successfully', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(validReceipt) }],
    });

    const result = await anthropicOcrProvider.parseReceipt(fakeImages, 'test-key', 'image/jpeg');
    expect(result.total).toBe(100);
    expect(result.merchant).toBe('Test Store');
    expect(result.items[0].normalizedName).toBe('item');
  });

  it('throws OcrError on rate limit', async () => {
    mockCreate.mockRejectedValue(new Error('Request failed: 429 rate limit'));

    try {
      await anthropicOcrProvider.parseReceipt(fakeImages, 'test-key', 'image/jpeg');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(OcrError);
      expect((err as OcrError).code).toBe('RATE_LIMITED');
      expect((err as OcrError).retryable).toBe(true);
    }
  });

  it('throws OcrError on empty response', async () => {
    mockCreate.mockResolvedValue({ content: [] });

    try {
      await anthropicOcrProvider.parseReceipt(fakeImages, 'test-key', 'image/jpeg');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(OcrError);
    }
  });
});
