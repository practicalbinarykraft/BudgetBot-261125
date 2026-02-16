import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

jest.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: {
      background: "#fff",
      text: "#000",
      textSecondary: "#666",
      primary: "#3b82f6",
      primaryForeground: "#fff",
      card: "#f9f9f9",
      border: "#e3e3e3",
      muted: "#ededed",
      secondary: "#f5f5f5",
      cardBorder: "#efefef",
    },
    isDark: false,
  }),
}));

jest.mock("../../i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        "reward.title": "Reward!",
        "reward.balance_change": "{before} → {after} credits",
        "reward.next_step": "Next step",
      };
      return map[key] ?? key;
    },
  }),
}));

const mockOpenTutorial = jest.fn();
jest.mock("../../lib/tutorial-ref", () => ({
  openTutorial: () => mockOpenTutorial(),
}));

let registeredShow: ((data: any) => void) | null = null;
jest.mock("../../lib/reward-modal-ref", () => ({
  registerRewardModal: (fn: any) => { registeredShow = fn; },
  unregisterRewardModal: () => { registeredShow = null; },
}));

import RewardModal from "../../components/RewardModal";

describe("RewardModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    registeredShow = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("is hidden by default", () => {
    const { queryByText } = render(<RewardModal />);
    expect(queryByText("Reward!")).toBeNull();
  });

  it("shows title, credits, and balance on trigger", () => {
    const { getByText } = render(<RewardModal />);
    act(() => {
      registeredShow?.({ creditsAwarded: 10, balanceBefore: 5, balanceAfter: 15 });
    });
    expect(getByText("Reward!")).toBeTruthy();
    expect(getByText("+10")).toBeTruthy();
    expect(getByText("5 → 15 credits")).toBeTruthy();
  });

  it("Next step button calls openTutorial after delay", () => {
    const { getByText } = render(<RewardModal />);
    act(() => {
      registeredShow?.({ creditsAwarded: 5, balanceBefore: 10, balanceAfter: 15 });
    });
    fireEvent.press(getByText("Next step"));
    act(() => { jest.advanceTimersByTime(200); });
    expect(mockOpenTutorial).toHaveBeenCalled();
  });
});
