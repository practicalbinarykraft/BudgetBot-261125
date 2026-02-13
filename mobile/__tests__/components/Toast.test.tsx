/**
 * Test: Toast component — show, auto-dismiss, type variants.
 */
import React from "react";
import { Pressable } from "react-native";
import { render, fireEvent, act, waitFor } from "@testing-library/react-native";
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
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders toast message when show() is called", async () => {
    const { getByTestId, findByText } = renderWithProvider(
      <TestConsumer message="Saved!" type="success" />
    );

    await act(async () => {
      fireEvent.press(getByTestId("show-toast"));
    });

    const msg = await findByText("Saved!");
    expect(msg).toBeTruthy();
  });

  it("auto-dismisses after 3 seconds", async () => {
    const { getByTestId, queryByText, findByText } = renderWithProvider(
      <TestConsumer message="Gone soon" />
    );

    await act(async () => {
      fireEvent.press(getByTestId("show-toast"));
    });

    await findByText("Gone soon");

    await act(async () => {
      jest.advanceTimersByTime(3100);
    });

    await waitFor(() => {
      expect(queryByText("Gone soon")).toBeNull();
    });
  });

  it("supports error type", async () => {
    const { getByTestId, findByText } = renderWithProvider(
      <TestConsumer message="Failed!" type="error" />
    );

    await act(async () => {
      fireEvent.press(getByTestId("show-toast"));
    });

    const msg = await findByText("Failed!");
    expect(msg).toBeTruthy();
  });

  it("supports info type", async () => {
    const { getByTestId, findByText } = renderWithProvider(
      <TestConsumer message="FYI" type="info" />
    );

    await act(async () => {
      fireEvent.press(getByTestId("show-toast"));
    });

    const msg = await findByText("FYI");
    expect(msg).toBeTruthy();
  });
});
