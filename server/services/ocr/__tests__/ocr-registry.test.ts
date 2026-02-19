import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  registerProvider,
  getProvider,
  getAllProviders,
  getProviderNames,
  getProviderOrder,
  clearRegistry,
} from '../ocr-registry';
import type { OcrProvider } from '../ocr-provider.types';

const fakeProvider: OcrProvider = {
  name: 'test-provider',
  billingProvider: 'anthropic',
  isAvailable: () => true,
  parseReceipt: vi.fn(),
};

beforeEach(() => {
  clearRegistry();
});

describe('ocr-registry', () => {
  it('registers and retrieves a provider', () => {
    registerProvider(fakeProvider);
    expect(getProvider('test-provider')).toBe(fakeProvider);
  });

  it('returns undefined for unregistered provider', () => {
    expect(getProvider('nope')).toBeUndefined();
  });

  it('lists all providers', () => {
    registerProvider(fakeProvider);
    registerProvider({ ...fakeProvider, name: 'second' });
    expect(getAllProviders()).toHaveLength(2);
  });

  it('lists provider names', () => {
    registerProvider(fakeProvider);
    expect(getProviderNames()).toEqual(['test-provider']);
  });

  it('clearRegistry removes all providers', () => {
    registerProvider(fakeProvider);
    clearRegistry();
    expect(getAllProviders()).toHaveLength(0);
  });
});

describe('getProviderOrder', () => {
  const originalEnv = process.env.OCR_PROVIDER_ORDER;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.OCR_PROVIDER_ORDER;
    } else {
      process.env.OCR_PROVIDER_ORDER = originalEnv;
    }
  });

  it('returns default order when env not set', () => {
    delete process.env.OCR_PROVIDER_ORDER;
    expect(getProviderOrder()).toEqual(['anthropic', 'openai']);
  });

  it('reads order from env var', () => {
    process.env.OCR_PROVIDER_ORDER = 'openai,anthropic';
    expect(getProviderOrder()).toEqual(['openai', 'anthropic']);
  });

  it('handles whitespace in env var', () => {
    process.env.OCR_PROVIDER_ORDER = ' openai , anthropic ';
    expect(getProviderOrder()).toEqual(['openai', 'anthropic']);
  });

  it('filters out empty strings', () => {
    process.env.OCR_PROVIDER_ORDER = 'openai,,anthropic';
    expect(getProviderOrder()).toEqual(['openai', 'anthropic']);
  });
});
