import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OcrError } from '../ocr-errors';

const mockCreate = vi.fn();

vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: mockCreate } } };
  }),
}));

vi.mock('../../../lib/logger', () => ({
  logError: vi.fn(),
  logWarning: vi.fn(),
  logInfo: vi.fn(),
}));

import { openaiOcrProvider } from '../openai-ocr-provider';
import type { ImageInput } from '../ocr-provider.types';

const fakeImages: ImageInput[] = [{ base64: 'abc', mimeType: 'image/jpeg' }];

const validReceipt = {
  total: 200,
  merchant: 'OpenAI Store',
  date: '2025-02-01',
  currency: 'EUR',
  items: [{ name: 'Widget 500g', quantity: 2, pricePerUnit: 100, totalPrice: 200 }],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('openaiOcrProvider', () => {
  it('has correct name and billingProvider', () => {
    expect(openaiOcrProvider.name).toBe('openai');
    expect(openaiOcrProvider.billingProvider).toBe('openai');
  });

  it('isAvailable returns true when SDK is installed', () => {
    expect(openaiOcrProvider.isAvailable()).toBe(true);
  });

  it('parses receipt successfully', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validReceipt) } }],
    });

    const result = await openaiOcrProvider.parseReceipt(fakeImages, 'test-key', 'image/jpeg');
    expect(result.total).toBe(200);
    expect(result.merchant).toBe('OpenAI Store');
    expect(result.items[0].normalizedName).toBe('widget');
  });

  it('throws OcrError on billing error', async () => {
    mockCreate.mockRejectedValue(new Error('insufficient credits'));

    try {
      await openaiOcrProvider.parseReceipt(fakeImages, 'test-key', 'image/jpeg');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(OcrError);
      expect((err as OcrError).code).toBe('BILLING_DISABLED');
      expect((err as OcrError).retryable).toBe(true);
    }
  });

  it('throws OcrError on empty response', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: '' } }] });

    try {
      await openaiOcrProvider.parseReceipt(fakeImages, 'test-key', 'image/jpeg');
      expect.unreachable('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(OcrError);
    }
  });
});
