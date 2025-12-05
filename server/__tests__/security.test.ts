/**
 * Security Tests
 *
 * Tests for security utilities and middleware.
 * Junior-Friendly: ~80 lines, covers XSS, SQL injection, sanitization
 */

import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeText,
  sanitizeObject,
  hasSqlInjection,
  sanitizeEmail,
} from '../lib/sanitize';

describe('Input Sanitization', () => {
  describe('sanitizeString', () => {
    it('escapes HTML entities', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('escapes ampersands', () => {
      expect(sanitizeString('foo & bar')).toBe('foo &amp; bar');
    });

    it('trims whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('handles non-string input', () => {
      expect(sanitizeString(null as unknown as string)).toBe('');
      expect(sanitizeString(undefined as unknown as string)).toBe('');
      expect(sanitizeString(123 as unknown as string)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('escapes HTML but keeps slashes', () => {
      expect(sanitizeText('<div>test</div>')).toContain('&lt;');
      expect(sanitizeText('path/to/file')).toBe('path/to/file');
    });
  });

  describe('sanitizeObject', () => {
    it('sanitizes all string values recursively', () => {
      const input = {
        name: '<script>xss</script>',
        nested: {
          value: '<b>bold</b>',
        },
        safe: 123,
      };

      const result = sanitizeObject(input);

      expect(result.name).not.toContain('<script>');
      expect(result.nested.value).not.toContain('<b>');
      expect(result.safe).toBe(123);
    });

    it('sanitizes arrays of strings', () => {
      const input = {
        tags: ['<script>', 'safe', '<img onerror="xss">'],
      };

      const result = sanitizeObject(input);

      expect(result.tags[0]).not.toContain('<script>');
      expect(result.tags[1]).toBe('safe');
    });
  });

  describe('hasSqlInjection', () => {
    it('detects SELECT injection', () => {
      expect(hasSqlInjection("'; SELECT * FROM users; --")).toBe(true);
    });

    it('detects DROP injection', () => {
      expect(hasSqlInjection('DROP TABLE users')).toBe(true);
    });

    it('detects OR 1=1 pattern', () => {
      expect(hasSqlInjection("' OR 1=1 --")).toBe(true);
    });

    it('detects comment patterns', () => {
      expect(hasSqlInjection('password -- comment')).toBe(true);
      expect(hasSqlInjection('value /* comment */')).toBe(true);
    });

    it('allows normal input', () => {
      expect(hasSqlInjection('John Doe')).toBe(false);
      expect(hasSqlInjection('user@example.com')).toBe(false);
      expect(hasSqlInjection('123.45')).toBe(false);
    });
  });

  describe('sanitizeEmail', () => {
    it('normalizes valid email', () => {
      expect(sanitizeEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
    });

    it('rejects invalid email', () => {
      expect(sanitizeEmail('not-an-email')).toBe(null);
      expect(sanitizeEmail('')).toBe(null);
    });
  });
});
