/**
 * Test: WalletCard renders "primary" badge only for isPrimary=1 wallets.
 */
import React from "react";
import { render } from "@testing-library/react-native";
import { WalletCard } from "../../components/WalletCard";
import type { Wallet } from "../../types";

// Mock useTheme
jest.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: {
      text: "#000",
      textSecondary: "#666",
      textTertiary: "#999",
      primary: "#3b82f6",
      primaryForeground: "#fff",
      card: "#fff",
      cardBorder: "#eee",
      secondary: "#f1f5f9",
      background: "#fff",
      border: "#e2e8f0",
    },
  }),
}));

jest.mock("../../i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = { "wallets.primary_badge": "Default" };
      return map[key] || key;
    },
    language: "en",
  }),
}));

const makeWallet = (overrides: Partial<Wallet> = {}): Wallet => ({
  id: 1,
  userId: 1,
  name: "My Wallet",
  type: "card",
  balance: "100.00",
  currency: "USD",
  balanceUsd: "100.00",
  isPrimary: 0,
  createdAt: "2025-01-01",
  ...overrides,
});

describe("WalletCard", () => {
  it("renders primary badge when isPrimary=1", () => {
    const { getByText } = render(
      <WalletCard wallet={makeWallet({ isPrimary: 1 })} />
    );
    expect(getByText("Default")).toBeTruthy();
  });

  it("does NOT render primary badge when isPrimary=0", () => {
    const { queryByText } = render(
      <WalletCard wallet={makeWallet({ isPrimary: 0 })} />
    );
    expect(queryByText("Default")).toBeNull();
  });
});
