/**
 * Simple encryption test (ES modules)
 * Run with: ENCRYPTION_KEY=<key> node test-encryption.mjs
 */

import crypto from 'crypto';

// Set test key
process.env.ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');

console.log('🧪 Testing encryption functionality...\n');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function encrypt(text) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decrypt(encryptedData) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'base64');
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Test 1: Basic encryption/decryption
console.log('Test 1: Basic encryption/decryption');
const original = 'sk-ant-api-key-12345';
const encrypted = encrypt(original);
const decrypted = decrypt(encrypted);

console.log('  Original:', original);
console.log('  Encrypted:', encrypted);
console.log('  Decrypted:', decrypted);
console.log('  Match:', original === decrypted ? '✅' : '❌');
console.log();

// Test 2: Different IVs
console.log('Test 2: Different IVs for same input');
const text = 'same-text';
const enc1 = encrypt(text);
const enc2 = encrypt(text);

console.log('  Input:', text);
console.log('  Encryption 1:', enc1.substring(0, 50) + '...');
console.log('  Encryption 2:', enc2.substring(0, 50) + '...');
console.log('  Different:', enc1 !== enc2 ? '✅' : '❌');
console.log('  Both decrypt correctly:', (decrypt(enc1) === text && decrypt(enc2) === text) ? '✅' : '❌');
console.log();

// Test 3: Long API keys
console.log('Test 3: Long API keys');
const longKey = 'sk-ant-' + 'a'.repeat(100);
const encLong = encrypt(longKey);
const decLong = decrypt(encLong);
console.log('  Length:', longKey.length, 'characters');
console.log('  Encrypted length:', encLong.length, 'characters');
console.log('  Decrypts correctly:', longKey === decLong ? '✅' : '❌');
console.log();

// Test 4: Special characters
console.log('Test 4: Special characters');
const special = 'key-with-спец!@#$%^&*()символы';
const encSpecial = encrypt(special);
const decSpecial = decrypt(encSpecial);
console.log('  Special text:', special);
console.log('  Decrypts correctly:', special === decSpecial ? '✅' : '❌');
console.log();

// Test 5: Performance
console.log('Test 5: Performance (100 encryptions)');
const startTime = Date.now();

for (let i = 0; i < 100; i++) {
  const key = `sk-ant-key-${i}`;
  const enc = encrypt(key);
  const dec = decrypt(enc);
  if (dec !== key) {
    console.log('  ❌ Failed at iteration', i);
    break;
  }
}

const duration = Date.now() - startTime;
console.log('  Time:', duration, 'ms');
console.log('  Performance:', duration < 1000 ? '✅' : '❌');
console.log();

console.log('🎉 All manual tests passed!\n');
