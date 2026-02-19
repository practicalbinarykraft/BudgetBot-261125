import { describe, it, expect } from 'vitest';
import { buildReceiptPrompt } from '../ocr-prompt';

describe('buildReceiptPrompt', () => {
  it('returns single-image prompt by default', () => {
    const prompt = buildReceiptPrompt(false);
    expect(prompt).toContain('Parse this receipt image');
    expect(prompt).not.toContain('multiple photos');
    expect(prompt).toContain('Return ONLY valid JSON');
    expect(prompt).toContain('"currency": "IDR"');
  });

  it('returns multi-image prompt when isMulti=true', () => {
    const prompt = buildReceiptPrompt(true);
    expect(prompt).toContain('split across multiple photos');
    expect(prompt).toContain('across ALL photos');
    expect(prompt).toContain('Deduplicate items');
  });

  it('includes all required fields', () => {
    const prompt = buildReceiptPrompt(false);
    expect(prompt).toContain('total');
    expect(prompt).toContain('currency');
    expect(prompt).toContain('merchant');
    expect(prompt).toContain('date');
    expect(prompt).toContain('items');
  });
});
