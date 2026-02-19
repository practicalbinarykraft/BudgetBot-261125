import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../lib/logger', () => ({
  logError: vi.fn(),
}));

import { parseLlmResponse } from '../parse-llm-response';

const validJson = JSON.stringify({
  total: 100,
  merchant: 'Test Store',
  date: '2025-01-01',
  currency: 'USD',
  items: [
    { name: 'Orange Juice 1L', quantity: 2, pricePerUnit: 25, totalPrice: 50 },
    { name: 'Bread', quantity: 1, pricePerUnit: 50, totalPrice: 50 },
  ],
});

describe('parseLlmResponse', () => {
  it('parses plain JSON', () => {
    const result = parseLlmResponse(validJson, 'TestProvider');
    expect(result.total).toBe(100);
    expect(result.merchant).toBe('Test Store');
    expect(result.items).toHaveLength(2);
  });

  it('extracts JSON from markdown code block', () => {
    const markdown = '```json\n' + validJson + '\n```';
    const result = parseLlmResponse(markdown, 'TestProvider');
    expect(result.total).toBe(100);
  });

  it('extracts JSON from bare code block', () => {
    const markdown = '```\n' + validJson + '\n```';
    const result = parseLlmResponse(markdown, 'TestProvider');
    expect(result.total).toBe(100);
  });

  it('normalizes item names', () => {
    const result = parseLlmResponse(validJson, 'TestProvider');
    expect(result.items[0].normalizedName).toBe('orange juice');
    expect(result.items[1].normalizedName).toBe('bread');
  });

  it('throws on empty response', () => {
    expect(() => parseLlmResponse('', 'TestProvider')).toThrow('empty response');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseLlmResponse('not json at all', 'TestProvider')).toThrow('Failed to parse');
  });

  it('throws on missing items array', () => {
    const noItems = JSON.stringify({ total: 100, merchant: 'Test', date: '2025-01-01' });
    expect(() => parseLlmResponse(noItems, 'TestProvider')).toThrow('missing or invalid items array');
  });

  it('throws on non-array items', () => {
    const badItems = JSON.stringify({ total: 100, merchant: 'Test', date: '2025-01-01', items: 'not array' });
    expect(() => parseLlmResponse(badItems, 'TestProvider')).toThrow('missing or invalid items array');
  });
});
