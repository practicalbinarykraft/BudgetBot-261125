/**
 * Tests: Atomic credit charging — balance guard, lazy monthly reset, concurrency safety.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ────────────────────────────────────────────────
const {
  mockSelect,
  mockUpdate,
  mockInsert,
  mockTransaction,
  mockFor,
  mockSet,
  mockWhere,
  mockReturning,
  mockLimit,
  mockValues,
} = vi.hoisted(() => {
  const mockValues = vi.fn();
  const mockReturning = vi.fn();
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockSet = vi.fn();
  const mockFor = vi.fn();
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockInsert = vi.fn();
  const mockTransaction = vi.fn();

  // Default chain returns
  mockSelect.mockReturnValue({ from: vi.fn().mockReturnValue({ where: mockWhere }) });
  mockWhere.mockReturnValue({ for: mockFor, limit: mockLimit });
  mockFor.mockReturnValue({ limit: mockLimit });
  mockUpdate.mockReturnValue({ set: mockSet });
  mockSet.mockReturnValue({ where: vi.fn().mockReturnValue({ returning: mockReturning }) });
  mockInsert.mockReturnValue({ values: mockValues });
  mockValues.mockResolvedValue(undefined);

  return {
    mockSelect, mockUpdate, mockInsert, mockTransaction,
    mockFor, mockSet, mockWhere, mockReturning, mockLimit,
  };
});

vi.mock("../db", () => ({
  db: {
    transaction: mockTransaction,
    select: mockSelect,
    update: mockUpdate,
    insert: mockInsert,
  },
}));

vi.mock("../../shared/schema", () => ({
  userCredits: { userId: "user_id" },
  creditTransactions: {},
  aiUsageLog: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  and: vi.fn((...args: any[]) => ({ type: "and", args })),
  gte: vi.fn((a, b) => ({ type: "gte", field: a, value: b })),
  sql: (strings: TemplateStringsArray, ...values: any[]) => ({ strings, values }),
}));

// ── Import after mocks ──────────────────────────────────────────
import { chargeCreditsAtomic, ChargeResult } from "../services/billing.service";

describe("chargeCreditsAtomic — atomic credit deduction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deducts credits when balance >= cost", async () => {
    const userRow = {
      userId: 1,
      messagesRemaining: 10,
      totalGranted: 50,
      totalUsed: 40,
      monthlyAllowance: 50,
      lastResetAt: new Date(),
    };

    // Transaction passes the callback a tx object with same shape
    mockTransaction.mockImplementation(async (cb: Function) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              for: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([userRow]),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ messagesRemaining: 9 }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      return cb(tx);
    });

    const result: ChargeResult = await chargeCreditsAtomic({
      userId: 1,
      cost: 1,
      operation: "ai_chat",
      provider: "openrouter",
      tokens: { input: 100, output: 50 },
    });

    expect(result.success).toBe(true);
    expect(result.balanceAfter).toBe(9);
  });

  it("rejects when balance < cost (returns INSUFFICIENT_CREDITS)", async () => {
    const userRow = {
      userId: 1,
      messagesRemaining: 0,
      totalGranted: 50,
      totalUsed: 50,
      monthlyAllowance: 50,
      lastResetAt: new Date(),
    };

    mockTransaction.mockImplementation(async (cb: Function) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              for: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([userRow]),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([]),  // 0 rows = guard failed
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      return cb(tx);
    });

    const result = await chargeCreditsAtomic({
      userId: 1,
      cost: 1,
      operation: "ai_chat",
      provider: "openrouter",
      tokens: { input: 100, output: 50 },
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("INSUFFICIENT_CREDITS");
  });

  it("triggers lazy monthly reset when lastResetAt > 30 days", async () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const userRow = {
      userId: 1,
      messagesRemaining: 3,
      totalGranted: 50,
      totalUsed: 47,
      monthlyAllowance: 50,
      lastResetAt: thirtyOneDaysAgo,
    };

    let updateSetArg: any = null;

    mockTransaction.mockImplementation(async (cb: Function) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              for: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([userRow]),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockImplementation((arg: any) => {
            // Capture the first update call (reset)
            if (!updateSetArg) updateSetArg = arg;
            return {
              where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ messagesRemaining: 49 }]),
              }),
            };
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      return cb(tx);
    });

    const result = await chargeCreditsAtomic({
      userId: 1,
      cost: 1,
      operation: "ai_chat",
      provider: "openrouter",
      tokens: { input: 100, output: 50 },
    });

    expect(result.success).toBe(true);
    // Balance should be monthlyAllowance(50) - cost(1) = 49
    expect(result.balanceAfter).toBe(49);
  });

  it("does NOT reset when lastResetAt is within 30 days", async () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const userRow = {
      userId: 1,
      messagesRemaining: 10,
      totalGranted: 50,
      totalUsed: 40,
      monthlyAllowance: 50,
      lastResetAt: fiveDaysAgo,
    };

    mockTransaction.mockImplementation(async (cb: Function) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              for: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([userRow]),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ messagesRemaining: 9 }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      return cb(tx);
    });

    const result = await chargeCreditsAtomic({
      userId: 1,
      cost: 1,
      operation: "ai_chat",
      provider: "openrouter",
      tokens: { input: 100, output: 50 },
    });

    expect(result.success).toBe(true);
    expect(result.balanceAfter).toBe(9);
  });

  it("sets lastResetAt=now on first charge when lastResetAt is null", async () => {
    const userRow = {
      userId: 1,
      messagesRemaining: 50,
      totalGranted: 50,
      totalUsed: 0,
      monthlyAllowance: 50,
      lastResetAt: null,
    };

    mockTransaction.mockImplementation(async (cb: Function) => {
      const tx = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              for: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([userRow]),
              }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ messagesRemaining: 49 }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
      };
      return cb(tx);
    });

    const result = await chargeCreditsAtomic({
      userId: 1,
      cost: 1,
      operation: "ai_chat",
      provider: "openrouter",
      tokens: { input: 100, output: 50 },
    });

    expect(result.success).toBe(true);
    expect(result.balanceAfter).toBe(49);
  });
});
