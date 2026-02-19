import { describe, it, expect } from 'vitest';
import { OcrError, shouldFallback, classifyProviderError } from '../ocr-errors';

describe('OcrError', () => {
  it('sets retryable=true for RATE_LIMITED', () => {
    const err = new OcrError('rate limited', 'RATE_LIMITED');
    expect(err.retryable).toBe(true);
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.name).toBe('OcrError');
  });

  it('sets retryable=true for PROVIDER_DOWN', () => {
    const err = new OcrError('503', 'PROVIDER_DOWN');
    expect(err.retryable).toBe(true);
  });

  it('sets retryable=true for BILLING_DISABLED', () => {
    const err = new OcrError('no credits', 'BILLING_DISABLED');
    expect(err.retryable).toBe(true);
  });

  it('sets retryable=true for INVALID_KEY', () => {
    const err = new OcrError('bad key', 'INVALID_KEY');
    expect(err.retryable).toBe(true);
  });

  it('sets retryable=false for BAD_INPUT', () => {
    const err = new OcrError('bad image', 'BAD_INPUT');
    expect(err.retryable).toBe(false);
  });

  it('sets retryable=false for PARSE_FAILED', () => {
    const err = new OcrError('json broken', 'PARSE_FAILED');
    expect(err.retryable).toBe(false);
  });
});

describe('shouldFallback', () => {
  it.each([
    ['RATE_LIMITED', true],
    ['PROVIDER_DOWN', true],
    ['BILLING_DISABLED', true],
    ['INVALID_KEY', true],
    ['BAD_INPUT', false],
    ['PARSE_FAILED', false],
  ] as const)('shouldFallback(%s) = %s', (code, expected) => {
    expect(shouldFallback(code)).toBe(expected);
  });
});

describe('classifyProviderError', () => {
  it('classifies credit balance errors as BILLING_DISABLED', () => {
    const err = classifyProviderError(new Error('credit balance is too low'));
    expect(err.code).toBe('BILLING_DISABLED');
    expect(err.retryable).toBe(true);
  });

  it('classifies rate limit errors as RATE_LIMITED', () => {
    const err = classifyProviderError(new Error('Request failed: 429'));
    expect(err.code).toBe('RATE_LIMITED');
    expect(err.retryable).toBe(true);
  });

  it('classifies 503 errors as PROVIDER_DOWN', () => {
    const err = classifyProviderError(new Error('Service unavailable 503'));
    expect(err.code).toBe('PROVIDER_DOWN');
    expect(err.retryable).toBe(true);
  });

  it('classifies overloaded errors as PROVIDER_DOWN', () => {
    const err = classifyProviderError(new Error('API is overloaded'));
    expect(err.code).toBe('PROVIDER_DOWN');
    expect(err.retryable).toBe(true);
  });

  it('classifies parse failures as PARSE_FAILED', () => {
    const err = classifyProviderError(new Error('Failed to parse response'));
    expect(err.code).toBe('PARSE_FAILED');
    expect(err.retryable).toBe(false);
  });

  it('classifies authentication errors as INVALID_KEY', () => {
    const err = classifyProviderError(new Error('authentication failed'));
    expect(err.code).toBe('INVALID_KEY');
    expect(err.retryable).toBe(true);
  });

  it('classifies unknown errors as PROVIDER_DOWN (retryable)', () => {
    const err = classifyProviderError(new Error('Something weird happened'));
    expect(err.code).toBe('PROVIDER_DOWN');
    expect(err.retryable).toBe(true);
  });

  it('handles non-Error values', () => {
    const err = classifyProviderError('string error 429');
    expect(err.code).toBe('RATE_LIMITED');
  });
});
