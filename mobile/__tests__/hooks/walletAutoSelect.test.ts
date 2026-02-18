/**
 * Test: Auto-select primary wallet in AddTransaction form.
 *
 * pickDefaultWalletId(wallets) should:
 * 1. Return isPrimary=1 wallet id
 * 2. Fallback to max balanceUsd if no primary
 * 3. Return null if no wallets
 */
import { pickDefaultWalletId } from "../../hooks/useAddTransactionScreen";
import type { Wallet } from "../../types";

const makeWallet = (overrides: Partial<Wallet> & { id: number }): Wallet => ({
  userId: 1,
  name: "Wallet",
  type: "card",
  balance: "0",
  currency: "USD",
  balanceUsd: "0",
  isPrimary: 0,
  createdAt: "2025-01-01",
  ...overrides,
});

describe("pickDefaultWalletId", () => {
  it("returns isPrimary=1 wallet id", () => {
    const wallets = [
      makeWallet({ id: 1, isPrimary: 0, balanceUsd: "500" }),
      makeWallet({ id: 2, isPrimary: 1, balanceUsd: "100" }),
    ];
    expect(pickDefaultWalletId(wallets)).toBe(2);
  });

  it("falls back to wallet with highest balanceUsd if no primary", () => {
    const wallets = [
      makeWallet({ id: 1, isPrimary: 0, balanceUsd: "100" }),
      makeWallet({ id: 2, isPrimary: 0, balanceUsd: "500" }),
      makeWallet({ id: 3, isPrimary: 0, balanceUsd: "200" }),
    ];
    expect(pickDefaultWalletId(wallets)).toBe(2);
  });

  it("returns null if wallets array is empty", () => {
    expect(pickDefaultWalletId([])).toBeNull();
  });

  it("returns the only wallet if there is exactly one", () => {
    const wallets = [makeWallet({ id: 7, isPrimary: 0, balanceUsd: "50" })];
    expect(pickDefaultWalletId(wallets)).toBe(7);
  });
});
