import React from "react";
import { render, fireEvent } from "@testing-library/react-native";

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
        "common.back": "Back",
        "tutorial.show_where": "Show where to tap",
        "tutorial.open_screen": "Open screen",
        "tutorial.step.add_transaction": "Add a transaction",
        "tutorial.step_help.add_transaction": "Tap the '+' button at the bottom.",
        "tutorial.step.create_wallet": "Create a wallet",
        "tutorial.step_help.create_wallet": "Set up your first wallet.",
        "tutorial.step.view_transactions": "View all transactions",
        "tutorial.step_help.view_transactions": "Tap 'View all' on the dashboard.",
      };
      return map[key] ?? key;
    },
  }),
}));

import { StepHelpView, type StepDef } from "../../components/tutorial/StepHelpView";

describe("StepHelpView", () => {
  const onBack = jest.fn();
  const onShowWhere = jest.fn();
  const onOpenScreen = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  const stepWithSpotlightAndRoute: StepDef = {
    stepId: "add_transaction",
    icon: "plus-circle",
    titleKey: "tutorial.step.add_transaction",
    descKey: "tutorial.desc.add_transaction",
    credits: 5,
    route: "AddTransaction",
  };

  const stepWithoutSpotlightOrRoute: StepDef = {
    stepId: "create_wallet",
    icon: "credit-card",
    titleKey: "tutorial.step.create_wallet",
    descKey: "tutorial.desc.create_wallet",
    credits: 10,
    route: "AddWallet",
  };

  const stepViewTransactions: StepDef = {
    stepId: "view_transactions",
    icon: "list",
    titleKey: "tutorial.step.view_transactions",
    descKey: "tutorial.desc.view_transactions",
    credits: 2,
  };

  it("renders title and description", () => {
    const { getByText } = render(
      <StepHelpView step={stepWithSpotlightAndRoute} onBack={onBack} onShowWhere={onShowWhere} onOpenScreen={onOpenScreen} />
    );
    expect(getByText("Add a transaction")).toBeTruthy();
    expect(getByText("Tap the '+' button at the bottom.")).toBeTruthy();
  });

  it("Show where calls onShowWhere with target id", () => {
    const { getByText } = render(
      <StepHelpView step={stepWithSpotlightAndRoute} onBack={onBack} onShowWhere={onShowWhere} onOpenScreen={onOpenScreen} />
    );
    fireEvent.press(getByText("Show where to tap"));
    expect(onShowWhere).toHaveBeenCalledWith("add_transaction");
  });

  it("Open screen calls onOpenScreen with route", () => {
    const { getByText } = render(
      <StepHelpView step={stepWithSpotlightAndRoute} onBack={onBack} onShowWhere={onShowWhere} onOpenScreen={onOpenScreen} />
    );
    fireEvent.press(getByText("Open screen"));
    expect(onOpenScreen).toHaveBeenCalledWith("AddTransaction");
  });

  it("Back calls onBack", () => {
    const { getByText } = render(
      <StepHelpView step={stepWithSpotlightAndRoute} onBack={onBack} onShowWhere={onShowWhere} onOpenScreen={onOpenScreen} />
    );
    fireEvent.press(getByText("Back"));
    expect(onBack).toHaveBeenCalled();
  });

  it("hides Show where for steps without spotlight mapping", () => {
    const { queryByText } = render(
      <StepHelpView step={stepWithoutSpotlightOrRoute} onBack={onBack} onShowWhere={onShowWhere} onOpenScreen={onOpenScreen} />
    );
    expect(queryByText("Show where to tap")).toBeNull();
  });

  it("hides Open screen for view_transactions (no route)", () => {
    const { queryByText } = render(
      <StepHelpView step={stepViewTransactions} onBack={onBack} onShowWhere={onShowWhere} onOpenScreen={onOpenScreen} />
    );
    expect(queryByText("Open screen")).toBeNull();
  });
});
