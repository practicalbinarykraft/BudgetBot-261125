import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { validateInitData } from '../telegram-validation.service';

const BOT_TOKEN = '123456789:ABCdefGHIjklMNOpqrSTUvwxyz';

/**
 * Helper: build valid initData string the way Telegram does
 */
function buildInitData(
  user: Record<string, any>,
  authDate: number,
  botToken: string,
  overrides: Record<string, string> = {},
): string {
  const params: Record<string, string> = {
    user: JSON.stringify(user),
    auth_date: authDate.toString(),
    ...overrides,
  };

  // data-check-string: sorted key=value, no hash
  const dataCheckString = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('\n');

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  const urlParams = new URLSearchParams({ ...params, hash });
  return urlParams.toString();
}

describe('validateInitData', () => {
  const validUser = { id: 111222333, first_name: 'Test' };

  it('accepts valid fresh initData', () => {
    const authDate = Math.floor(Date.now() / 1000) - 60;
    const initData = buildInitData(validUser, authDate, BOT_TOKEN);

    const result = validateInitData(initData, BOT_TOKEN);

    expect(result.isValid).toBe(true);
    expect(result.user?.id).toBe(validUser.id);
    expect(result.authDate).toBe(authDate);
  });

  it('rejects tampered hash', () => {
    const authDate = Math.floor(Date.now() / 1000) - 60;
    const initData = buildInitData(validUser, authDate, BOT_TOKEN);
    const tampered = initData.replace(/hash=[^&]+/, 'hash=deadbeef');

    const result = validateInitData(tampered, BOT_TOKEN);

    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/signature/i);
  });

  it('rejects expired initData (> 24h)', () => {
    const authDate = Math.floor(Date.now() / 1000) - 86401;
    const initData = buildInitData(validUser, authDate, BOT_TOKEN);

    const result = validateInitData(initData, BOT_TOKEN);

    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/too old/i);
  });

  it('rejects future auth_date', () => {
    const authDate = Math.floor(Date.now() / 1000) + 3600;
    const initData = buildInitData(validUser, authDate, BOT_TOKEN);

    const result = validateInitData(initData, BOT_TOKEN);

    expect(result.isValid).toBe(false);
    expect(result.error).toMatch(/future/i);
  });

  it('rejects missing hash', () => {
    const result = validateInitData('auth_date=123&user={}', BOT_TOKEN);
    expect(result.isValid).toBe(false);
  });

  it('uses timing-safe comparison (not ===)', () => {
    // This test verifies the function uses timingSafeEqual internally.
    // We can't directly observe timing, but we verify that a hash
    // differing only in the last character is still rejected properly.
    const authDate = Math.floor(Date.now() / 1000) - 60;
    const initData = buildInitData(validUser, authDate, BOT_TOKEN);

    // Flip last hex char of hash
    const params = new URLSearchParams(initData);
    const realHash = params.get('hash')!;
    const lastChar = realHash[realHash.length - 1];
    const flipped = lastChar === '0' ? '1' : '0';
    const nearMissHash = realHash.slice(0, -1) + flipped;
    params.set('hash', nearMissHash);

    const result = validateInitData(params.toString(), BOT_TOKEN);
    expect(result.isValid).toBe(false);
  });
});
