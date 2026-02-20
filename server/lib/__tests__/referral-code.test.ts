import { describe, it, expect } from "vitest";
import { generateReferralCode } from "../referral-code";

const AMBIGUOUS = /[O0I1l]/;

describe("generateReferralCode", () => {
  it("returns an 8-character string", () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(8);
  });

  it("contains only allowed characters (no ambiguous O/0/I/1/l)", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateReferralCode();
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/);
      expect(code).not.toMatch(AMBIGUOUS);
    }
  });

  it("generates unique codes (high probability)", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateReferralCode());
    }
    // With 30^8 ≈ 6.5×10^11 possibilities, 1000 codes should all be unique
    expect(codes.size).toBe(1000);
  });
});
