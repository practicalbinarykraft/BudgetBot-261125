/**
 * Test: QueryErrorBanner shows error message and Retry button.
 */

jest.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: {
      destructive: "#ef4444",
      text: "#000",
      textSecondary: "#666",
      primary: "#3b82f6",
      primaryForeground: "#fff",
      border: "#e2e8f0",
      card: "#fff",
      muted: "#f1f5f9",
      background: "#fff",
    },
    isDark: false,
  }),
}));

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { QueryErrorBanner } from "../../components/QueryErrorBanner";

describe("QueryErrorBanner", () => {
  it("renders error message", () => {
    const { getByText } = render(
      <QueryErrorBanner message="Failed to load categories" onRetry={() => {}} />
    );
    expect(getByText("Failed to load categories")).toBeTruthy();
  });

  it("renders retry button", () => {
    const { getByText } = render(
      <QueryErrorBanner message="Error" onRetry={() => {}} retryLabel="Retry" />
    );
    expect(getByText("Retry")).toBeTruthy();
  });

  it("calls onRetry when retry button is pressed", () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <QueryErrorBanner message="Error" onRetry={onRetry} retryLabel="Retry" />
    );
    fireEvent.press(getByText("Retry"));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("has testID for the banner container", () => {
    const { getByTestId } = render(
      <QueryErrorBanner message="Error" onRetry={() => {}} />
    );
    expect(getByTestId("query-error-banner")).toBeTruthy();
  });
});
