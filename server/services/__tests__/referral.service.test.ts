import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db before imports
const mockTransaction = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock("../../db", () => ({
  db: {
    select: (...args: any[]) => mockSelect(...args),
    insert: (...args: any[]) => mockInsert(...args),
    update: (...args: any[]) => mockUpdate(...args),
    transaction: (fn: any) => mockTransaction(fn),
  },
}));

vi.mock("../../lib/logger", () => ({
  logInfo: vi.fn(),
  logError: vi.fn(),
}));

vi.mock("../../lib/referral-code", () => ({
  generateReferralCode: vi.fn().mockReturnValue("ABCD1234"),
}));

vi.mock("../../repositories/reward-settings.repository", () => ({
  getRewardValue: vi.fn().mockResolvedValue(50),
}));

import { grantSignupReward, grantOnboardingReward, ensureReferralCode } from "../referral.service";
import { getRewardValue } from "../../repositories/reward-settings.repository";
import { generateReferralCode } from "../../lib/referral-code";

describe("referral.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("grantSignupReward", () => {
    it("reads reward settings for both referrer and referred", async () => {
      // Make transaction execute the callback
      mockTransaction.mockImplementation(async (fn) => {
        const tx = createMockTx({ insertReturns: [{ id: 1 }], creditsRow: { messagesRemaining: 50, totalGranted: 50 } });
        return fn(tx);
      });

      await grantSignupReward(1, 2);

      expect(getRewardValue).toHaveBeenCalledWith("referral_signup_referrer");
      expect(getRewardValue).toHaveBeenCalledWith("referral_signup_referred");
    });

    it("grants credits to both users via transaction", async () => {
      let txCallCount = 0;
      mockTransaction.mockImplementation(async (fn) => {
        txCallCount++;
        const tx = createMockTx({ insertReturns: [{ id: txCallCount }], creditsRow: { messagesRemaining: 50, totalGranted: 50 } });
        return fn(tx);
      });

      await grantSignupReward(10, 20);

      // Two transactions: one for referrer, one for referred
      expect(mockTransaction).toHaveBeenCalledTimes(2);
    });
  });

  describe("grantOnboardingReward", () => {
    it("does nothing if user has no referrer", async () => {
      mockSelect.mockReturnValue(chainable([{ referredBy: null }]));

      await grantOnboardingReward(5);

      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("does nothing if fewer than 8 tutorial steps completed", async () => {
      let callCount = 0;
      mockSelect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return chainable([{ referredBy: 1 }]);
        return chainable([{ count: 3 }]);
      });

      await grantOnboardingReward(5);

      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it("grants reward when all 8 steps are completed", async () => {
      let callCount = 0;
      mockSelect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return chainable([{ referredBy: 1 }]);
        return chainable([{ count: 8 }]);
      });

      mockTransaction.mockImplementation(async (fn) => {
        const tx = createMockTx({ insertReturns: [{ id: 1 }], creditsRow: { messagesRemaining: 100, totalGranted: 100 } });
        return fn(tx);
      });

      await grantOnboardingReward(5);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe("ensureReferralCode", () => {
    it("returns existing code if user already has one", async () => {
      mockSelect.mockReturnValue(chainable([{ referralCode: "EXIST123" }]));

      const code = await ensureReferralCode(1);

      expect(code).toBe("EXIST123");
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("generates and stores a new code if user has none", async () => {
      mockSelect.mockReturnValue(chainable([{ referralCode: null }]));
      mockUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ referralCode: "ABCD1234" }]),
          }),
        }),
      });

      const code = await ensureReferralCode(1);

      expect(code).toBe("ABCD1234");
      expect(generateReferralCode).toHaveBeenCalled();
    });
  });
});

// Helpers

function chainable(data: any[]) {
  // where() returns a thenable that also has .limit() and .for()
  const whereResult: any = Promise.resolve(data);
  whereResult.limit = vi.fn().mockResolvedValue(data);
  whereResult.for = vi.fn().mockReturnValue({
    limit: vi.fn().mockResolvedValue(data),
  });

  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(whereResult),
    }),
  };
}

function createMockTx(opts: { insertReturns: any[]; creditsRow: any }) {
  return {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(opts.insertReturns),
        }),
      }),
    }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          for: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([opts.creditsRow]),
          }),
        }),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  };
}
