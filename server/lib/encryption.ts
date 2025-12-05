import crypto from 'crypto';

/**
 * Encryption service for sensitive data (API keys, tokens)
 * Uses AES-256-GCM for authenticated encryption
 *
 * Security features:
 * - Random IV for each encryption (prevents pattern detection)
 * - Authentication tag (prevents tampering)
 * - 256-bit key (strong encryption)
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // AES block size
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key from environment
 * Must be 32 bytes (256 bits) encoded as base64
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY environment variable is required. ' +
      'Generate with: openssl rand -base64 32'
    );
  }

  try {
    const keyBuffer = Buffer.from(key, 'base64');

    if (keyBuffer.length !== 32) {
      throw new Error(
        `ENCRYPTION_KEY must be 32 bytes (256 bits). ` +
        `Current length: ${keyBuffer.length} bytes. ` +
        `Generate with: openssl rand -base64 32`
      );
    }

    return keyBuffer;
  } catch (err: unknown) {
    throw new Error(
      `Invalid ENCRYPTION_KEY format: ${err instanceof Error ? err.message : String(err)}. ` +
      `Must be 32 bytes in base64 format. ` +
      `Generate with: openssl rand -base64 32`
    );
  }
}

/**
 * Encrypt sensitive text
 * Returns: iv:authTag:encryptedData (all in hex)
 *
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format "iv:authTag:encrypted"
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty text');
  }

  const key = getEncryptionKey();

  // Generate random IV for each encryption
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt encrypted text
 *
 * @param encryptedData - Encrypted string in format "iv:authTag:encrypted"
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty data');
  }

  const key = getEncryptionKey();

  // Parse encrypted data
  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error(
      'Invalid encrypted data format. Expected "iv:authTag:encrypted"'
    );
  }

  const [ivHex, authTagHex, encrypted] = parts;

  try {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length: ${iv.length}`);
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length: ${authTag.length}`);
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err: unknown) {
    throw new Error(`Decryption failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Check if a string appears to be encrypted
 * (has the format iv:authTag:encrypted)
 */
export function isEncrypted(data: string): boolean {
  if (!data) return false;

  const parts = data.split(':');
  if (parts.length !== 3) return false;

  // Check if parts look like hex strings
  const hexRegex = /^[0-9a-f]+$/i;
  return parts.every(part => hexRegex.test(part));
}

/**
 * Safely encrypt if not already encrypted
 * Useful for migration scenarios
 */
export function encryptIfNeeded(text: string | null): string | null {
  if (!text) return null;
  if (isEncrypted(text)) return text;
  return encrypt(text);
}

/**
 * Safely decrypt if encrypted, otherwise return as-is
 * Useful for migration scenarios
 */
export function decryptIfNeeded(data: string | null): string | null {
  if (!data) return null;
  if (!isEncrypted(data)) return data;
  return decrypt(data);
}
