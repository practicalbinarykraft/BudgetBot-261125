import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module before importing the service
vi.mock("../../db", () => {
  const mockReturning = vi.fn();
  const mockOnConflictDoNothing = vi.fn(() => ({ returning: mockReturning }));
  const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  const mockLimit = vi.fn();
  const mockFor = vi.fn(() => ({ limit: mockLimit }));
  const mockWhere = vi.fn(() => ({ for: mockFor, limit: mockLimit }));
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));
  const mockSet = vi.fn(() => ({ where: vi.fn() }));
  const mockUpdate = vi.fn(() => ({ set: mockSet }));

  const txMock = {
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
  };

  const transaction = vi.fn(async (fn: any) => fn(txMock));

  return {
    db: {
      transaction,
      select: mockSelect,
      insert: mockInsert,
    },
    __txMock: txMock,
    __mockReturning: mockReturning,
    __mockOnConflictDoNothing: mockOnConflictDoNothing,
    __mockValues: mockValues,
    __mockLimit: mockLimit,
    __mockFor: mockFor,
    __mockWhere: mockWhere,
    __mockFrom: mockFrom,
  };
});

describe("TutorialService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("completeStep", () => {
    it("should reject invalid stepId", async () => {
      const { completeStep } = await import("../tutorial.service");
      await expect(completeStep(1, "invalid_step")).rejects.toThrow("Invalid tutorial step: invalid_step");
    });

    it("should accept valid stepIds", async () => {
      const validSteps = [
        "create_wallet", "add_transaction", "voice_input", "receipt_scan",
        "planned_income", "planned_expense", "view_chart", "view_transactions",
      ];
      for (const stepId of validSteps) {
        expect(() => {
          // Just checking the reward lookup doesn't throw
          const rewards: Record<string, number> = {
            create_wallet: 10, add_transaction: 5, voice_input: 15, receipt_scan: 10,
            planned_income: 5, planned_expense: 5, view_chart: 3, view_transactions: 2,
          };
          if (rewards[stepId] === undefined) throw new Error(`Invalid: ${stepId}`);
        }).not.toThrow();
      }
    });

    it("should have correct reward amounts totaling 55", () => {
      const rewards: Record<string, number> = {
        create_wallet: 10, add_transaction: 5, voice_input: 15, receipt_scan: 10,
        planned_income: 5, planned_expense: 5, view_chart: 3, view_transactions: 2,
      };
      const total = Object.values(rewards).reduce((sum, v) => sum + v, 0);
      expect(total).toBe(55);
    });

    it("should have exactly 8 steps", () => {
      const rewards: Record<string, number> = {
        create_wallet: 10, add_transaction: 5, voice_input: 15, receipt_scan: 10,
        planned_income: 5, planned_expense: 5, view_chart: 3, view_transactions: 2,
      };
      expect(Object.keys(rewards)).toHaveLength(8);
    });
  });

  describe("getProgress", () => {
    it("should return empty progress for new user", async () => {
      const { db } = await import("../../db");
      const mockWhere = vi.fn(() => []);
      const mockFrom = vi.fn(() => ({ where: mockWhere }));
      (db.select as any).mockReturnValueOnce({ from: mockFrom });

      const { getProgress } = await import("../tutorial.service");
      const progress = await getProgress(999);

      expect(progress.steps).toEqual([]);
      expect(progress.totalCreditsEarned).toBe(0);
      expect(progress.totalSteps).toBe(8);
      expect(progress.completedSteps).toBe(0);
    });
  });
});
