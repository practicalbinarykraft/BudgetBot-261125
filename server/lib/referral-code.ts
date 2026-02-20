import crypto from "crypto";

// Alphabet without ambiguous characters: O/0, I/1/l
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/**
 * Generate a random referral code (8 chars, no ambiguous characters).
 * Uses crypto.randomBytes for uniform randomness.
 */
export function generateReferralCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}
