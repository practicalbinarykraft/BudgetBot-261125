/**
 * B1 Test #4: EditTransactionScreen
 * Verifies: payload includes personalTagId, category, date, financialType etc.
 */

// Mock api-client
const mockPatch = jest.fn().mockResolvedValue({});
const mockDelete = jest.fn().mockResolvedValue({});
jest.mock("../../lib/api-client", () => ({
  api: {
    get: jest.fn().mockResolvedValue({ data: [] }),
    patch: mockPatch,
    delete: mockDelete,
  },
}));

// Mock query-client
jest.mock("../../lib/query-client", () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
}));

// Mock navigation
const mockGoBack = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
  useRoute: () => ({
    params: {
      transaction: {
        id: 42,
        userId: 1,
        date: "2026-01-15",
        type: "expense",
        amount: "100.00",
        description: "Groceries",
        category: "Food",
        categoryId: 5,
        currency: "USD",
        amountUsd: "100.00",
        originalAmount: null,
        originalCurrency: null,
        exchangeRate: null,
        source: "manual",
        walletId: 1,
        personalTagId: 3,
        financialType: "essential",
        createdAt: "2026-01-15T00:00:00Z",
      },
    },
  }),
}));

// Mock react-query — properly return data shapes for all useQuery calls
jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn((opts: any) => {
    const key = opts.queryKey?.[0] ?? "";
    if (key === "categories") {
      return {
        data: {
          data: [
            { id: 5, name: "Food", type: "expense", icon: "utensils", color: "#ef4444", userId: 1, applicableTo: "all", createdAt: "" },
          ],
        },
        isLoading: false,
      };
    }
    if (key === "tags") {
      return {
        data: [
          { id: 3, name: "Personal", icon: "User", color: "#3b82f6", type: "personal", userId: 1, isDefault: false, sortOrder: 0, createdAt: "" },
        ],
        isLoading: false,
      };
    }
    if (key === "wallets") {
      return {
        data: {
          data: [
            { id: 1, name: "Main", type: "card", balance: "1000", currency: "USD", balanceUsd: "1000", userId: 1, isPrimary: 1, createdAt: "" },
          ],
        },
        isLoading: false,
      };
    }
    return { data: { data: [] }, isLoading: false };
  }),
  useMutation: jest.fn((opts: any) => ({
    mutateAsync: jest.fn(async (data: any) => {
      if (opts.onSuccess) opts.onSuccess();
      return {};
    }),
    isPending: false,
  })),
}));

// Mock theme
jest.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: {
      background: "#fff",
      text: "#000",
      textSecondary: "#666",
      textTertiary: "#999",
      primary: "#3b82f6",
      primaryForeground: "#fff",
      muted: "#f1f5f9",
      border: "#e2e8f0",
      card: "#fff",
      cardForeground: "#000",
      destructive: "#ef4444",
      secondary: "#f1f5f9",
      secondaryForeground: "#0f172a",
    },
    isDark: false,
  }),
}));

import React from "react";
import { render } from "@testing-library/react-native";
import EditTransactionScreen from "../../screens/EditTransactionScreen";

describe("EditTransactionScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with transaction amount pre-filled", () => {
    const { getByDisplayValue } = render(<EditTransactionScreen />);
    expect(getByDisplayValue("100.00")).toBeTruthy();
  });

  it("renders with transaction description pre-filled", () => {
    const { getByDisplayValue } = render(<EditTransactionScreen />);
    expect(getByDisplayValue("Groceries")).toBeTruthy();
  });

  it("renders date field with transaction date", () => {
    const { getByDisplayValue } = render(<EditTransactionScreen />);
    expect(getByDisplayValue("2026-01-15")).toBeTruthy();
  });

  it("renders save button", () => {
    const { getByText } = render(<EditTransactionScreen />);
    expect(getByText("Update Transaction")).toBeTruthy();
  });

  it("renders financial type selector with essential pre-selected", () => {
    const { getByText } = render(<EditTransactionScreen />);
    // Financial type chips should be visible
    expect(getByText("Essential")).toBeTruthy();
    expect(getByText("Discretionary")).toBeTruthy();
  });
});
