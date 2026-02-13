/**
 * Test: Toast component — show, auto-dismiss, type variants.
 * Fake timers used only for auto-dismiss test; show tests use real timers.
 */
import React from "react";
import { Pressable } from "react-native";
import { render, fireEvent, act } from "@testing-library/react-native";
import { ToastProvider, useToast } from "../../components/Toast";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}));

jest.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: {
      background: "#fff",
      text: "#000",
      textSecondary: "#666",
      primary: "#3b82f6",
      destructive: "#dc2626",
      success: "#22c55e",
      warning: "#f59e0b",
      card: "#f9f9f9",
      border: "#e3e3e3",
    },
    isDark: false,
  }),
}));

function TestConsumer({ message, type }: { message: string; type?: "success" | "error" | "info" }) {
  const toast = useToast();
  return (
    <Pressable
      testID="show-toast"
      onPress={() => toast.show(message, type)}
    />
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

describe("Toast", () => {
  it("renders toast message when show() is called", () => {
    const { getByTestId, getByText } = renderWithProvider(
      <TestConsumer message="Saved!" type="success" />
    );

    fireEvent.press(getByTestId("show-toast"));

    expect(getByText("Saved!")).toBeTruthy();
  });

  it("auto-dismisses after 3 seconds", () => {
    jest.useFakeTimers();

    const { getByTestId, getByText, queryByText } = renderWithProvider(
      <TestConsumer message="Gone soon" />
    );

    fireEvent.press(getByTestId("show-toast"));
    expect(getByText("Gone soon")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(3100);
    });

    expect(queryByText("Gone soon")).toBeNull();

    jest.useRealTimers();
  });

  it("supports error type", () => {
    const { getByTestId, getByText } = renderWithProvider(
      <TestConsumer message="Failed!" type="error" />
    );

    fireEvent.press(getByTestId("show-toast"));

    expect(getByText("Failed!")).toBeTruthy();
  });

  it("supports info type", () => {
    const { getByTestId, getByText } = renderWithProvider(
      <TestConsumer message="FYI" type="info" />
    );

    fireEvent.press(getByTestId("show-toast"));

    expect(getByText("FYI")).toBeTruthy();
  });
});
