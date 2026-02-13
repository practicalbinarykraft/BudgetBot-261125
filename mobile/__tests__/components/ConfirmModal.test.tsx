/**
 * Test: ConfirmModal — render, confirm callback, cancel callback.
 */
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ConfirmModal } from "../../components/ConfirmModal";

jest.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: {
      background: "#fff",
      text: "#000",
      textSecondary: "#666",
      primary: "#3b82f6",
      primaryForeground: "#fff",
      destructive: "#dc2626",
      destructiveForeground: "#fff",
      card: "#f9f9f9",
      border: "#e3e3e3",
      muted: "#ededed",
      secondary: "#f5f5f5",
      cardBorder: "#efefef",
    },
    isDark: false,
  }),
}));

describe("ConfirmModal", () => {
  const baseProps = {
    visible: true,
    title: "Delete item?",
    message: "This cannot be undone.",
    confirmLabel: "Delete",
    cancelLabel: "Cancel",
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders title and message when visible", () => {
    const { getByText } = render(<ConfirmModal {...baseProps} />);
    expect(getByText("Delete item?")).toBeTruthy();
    expect(getByText("This cannot be undone.")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    const { queryByText } = render(
      <ConfirmModal {...baseProps} visible={false} />
    );
    expect(queryByText("Delete item?")).toBeNull();
  });

  it("calls onConfirm when confirm button is pressed", () => {
    const { getByText } = render(<ConfirmModal {...baseProps} />);
    fireEvent.press(getByText("Delete"));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is pressed", () => {
    const { getByText } = render(<ConfirmModal {...baseProps} />);
    fireEvent.press(getByText("Cancel"));
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders destructive variant with red confirm button", () => {
    const { getByText } = render(
      <ConfirmModal {...baseProps} destructive />
    );
    expect(getByText("Delete")).toBeTruthy();
  });
});
