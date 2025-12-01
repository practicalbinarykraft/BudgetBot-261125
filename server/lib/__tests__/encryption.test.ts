import { describe, it, expect, beforeAll } from 'vitest';
import { encrypt, decrypt, isEncrypted, encryptIfNeeded, decryptIfNeeded } from '../encryption';

// Ensure encryption key is set for tests
beforeAll(() => {
  if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = 'U4rnuZd9jFqJb5yokp5e1DrI8QCmSZx8HpDX4lLZUqI='; // Valid base64 key for testing
  }
});

describe('Encryption Service', () => {
  const testKey = 'sk-ant-test-api-key-12345678901234567890';

  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const encrypted = encrypt(testKey);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(testKey);
      expect(typeof encrypted).toBe('string');
    });

    it('should produce format: iv:authTag:encrypted', () => {
      const encrypted = encrypt(testKey);
      const parts = encrypted.split(':');
      expect(parts.length).toBe(3);
      // Each part should be hex-encoded
      parts.forEach(part => {
        expect(part).toMatch(/^[0-9a-f]+$/);
      });
    });

    it('should produce different ciphertext for same input', () => {
      const encrypted1 = encrypt(testKey);
      const encrypted2 = encrypt(testKey);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle long API keys', () => {
      const longKey = 'sk-proj-' + 'a'.repeat(500);
      const encrypted = encrypt(longKey);
      expect(encrypted).toBeDefined();
    });

    it('should handle special characters', () => {
      const specialKey = 'key-with-special-chars-!@#$%^&*()_+-={}[]|:;<>?,./~`';
      const encrypted = encrypt(specialKey);
      expect(encrypted).toBeDefined();
    });

    it('should reject empty string', () => {
      expect(() => encrypt('')).toThrow();
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted data', () => {
      const encrypted = encrypt(testKey);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(testKey);
    });

    it('should handle long keys', () => {
      const longKey = 'sk-proj-' + 'a'.repeat(500);
      const encrypted = encrypt(longKey);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(longKey);
    });

    it('should reject invalid format', () => {
      expect(() => decrypt('invalid-format')).toThrow();
    });

    it('should reject corrupted data', () => {
      const encrypted = encrypt(testKey);
      const corrupted = encrypted.replace(/a/g, 'b');
      expect(() => decrypt(corrupted)).toThrow();
    });

    it('should reject empty string', () => {
      expect(() => decrypt('')).toThrow();
    });
  });

  describe('isEncrypted', () => {
    it('should detect encrypted strings', () => {
      const encrypted = encrypt(testKey);
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it('should not detect plain strings as encrypted', () => {
      expect(isEncrypted('sk-ant-plain-key')).toBe(false);
      expect(isEncrypted('simple-string')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isEncrypted('')).toBe(false);
    });

    it('should return false for invalid format', () => {
      expect(isEncrypted('aa:bb')).toBe(false); // Only 2 parts
      expect(isEncrypted('aa:bb:cc:dd')).toBe(false); // 4 parts
    });
  });

  describe('encryptIfNeeded', () => {
    it('should encrypt plain keys', () => {
      const result = encryptIfNeeded(testKey);
      expect(result).not.toBe(testKey);
      expect(isEncrypted(result)).toBe(true);
    });

    it('should not re-encrypt encrypted keys', () => {
      const encrypted = encrypt(testKey);
      const result = encryptIfNeeded(encrypted);
      expect(result).toBe(encrypted);
    });
  });

  describe('decryptIfNeeded', () => {
    it('should decrypt encrypted keys', () => {
      const encrypted = encrypt(testKey);
      const result = decryptIfNeeded(encrypted);
      expect(result).toBe(testKey);
    });

    it('should not modify plain keys', () => {
      const result = decryptIfNeeded(testKey);
      expect(result).toBe(testKey);
    });
  });

  describe('Real API keys', () => {
    it('should handle Anthropic API keys', () => {
      const anthropicKey = 'sk-ant-api03-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz-xyz';
      const encrypted = encrypt(anthropicKey);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(anthropicKey);
    });

    it('should handle OpenAI API keys', () => {
      const openaiKey = 'sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz';
      const encrypted = encrypt(openaiKey);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(openaiKey);
    });
  });

  describe('Performance', () => {
    it('should encrypt/decrypt 100 keys in reasonable time', () => {
      const keys = Array.from({ length: 100 }, (_, i) => `key-${i}`);

      const start = Date.now();
      const encrypted = keys.map(k => encrypt(k));
      const decrypted = encrypted.map(e => decrypt(e));
      const duration = Date.now() - start;

      expect(decrypted).toEqual(keys);
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });
});
