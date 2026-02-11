/**
 * B1 Test #2: OnboardingDialog
 * Verifies: step flow transitions and AsyncStorage flag.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import OnboardingDialog from "../../components/OnboardingDialog";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock api
jest.mock("../../lib/api-client", () => ({
  api: {
    post: jest.fn().mockResolvedValue({ id: 1, name: "Test Wallet" }),
  },
}));

// Mock query-client
jest.mock("../../lib/query-client", () => ({
  queryClient: {
    invalidateQueries: jest.fn(),
  },
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

// Mock @tanstack/react-query
jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn().mockResolvedValue({}),
    isPending: false,
  })),
}));

describe("OnboardingDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it("shows dialog when onboarding is not completed", async () => {
    const { findByText } = render(<OnboardingDialog userId={1} />);
    const title = await findByText("Welcome to BudgetBot!");
    expect(title).toBeTruthy();
  });

  it("does not show dialog when onboarding is already completed", async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue("true");
    const { queryByText } = render(<OnboardingDialog userId={1} />);
    await waitFor(() => {
      expect(queryByText("Welcome to BudgetBot!")).toBeNull();
    });
  });

  it("does not show dialog when userId is undefined", async () => {
    const { queryByText } = render(<OnboardingDialog userId={undefined} />);
    await waitFor(() => {
      expect(queryByText("Welcome to BudgetBot!")).toBeNull();
    });
  });

  it("transitions from welcome to wallet step on Get Started", async () => {
    const { findByText } = render(<OnboardingDialog userId={1} />);
    const btn = await findByText("Get Started");
    fireEvent.press(btn);
    const walletTitle = await findByText("Create Your First Wallet");
    expect(walletTitle).toBeTruthy();
  });

  it("sets AsyncStorage flag when Skip is pressed on welcome", async () => {
    const { findByText } = render(<OnboardingDialog userId={1} />);
    const skip = await findByText("Skip for now");
    fireEvent.press(skip);
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "budgetbot_onboarding_completed",
        "true"
      );
    });
  });
});
