import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

jest.mock("react-native-svg", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: any) => <View {...props} />,
    Path: (props: any) => <View testID="svg-path" {...props} />,
  };
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
}));

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
        "spotlight.add_transaction": "Tap here to add a transaction",
        "spotlight.got_it": "Got it",
      };
      return map[key] ?? key;
    },
  }),
}));

jest.mock("../../lib/view-all-ref", () => ({
  getViewAllRect: () => null,
}));

let registeredShow: ((targetId: string) => void) | null = null;
jest.mock("../../lib/spotlight-ref", () => ({
  registerSpotlightShow: (fn: any) => { registeredShow = fn; },
  unregisterSpotlightShow: () => { registeredShow = null; },
}));

import SpotlightOverlay from "../../components/SpotlightOverlay";

describe("SpotlightOverlay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    registeredShow = null;
  });

  it("is hidden when no target", () => {
    const { queryByTestId } = render(<SpotlightOverlay />);
    expect(queryByTestId("svg-path")).toBeNull();
  });

  it("renders SVG when target is set", () => {
    const { getByTestID, getByText } = render(<SpotlightOverlay />);
    act(() => {
      registeredShow?.("add_transaction");
    });
    // Should show the tooltip text
    expect(getByText("Tap here to add a transaction")).toBeTruthy();
  });

  it("Got it clears the overlay", () => {
    const { getByText, queryByText } = render(<SpotlightOverlay />);
    act(() => {
      registeredShow?.("add_transaction");
    });
    expect(getByText("Got it")).toBeTruthy();
    fireEvent.press(getByText("Got it"));
    expect(queryByText("Tap here to add a transaction")).toBeNull();
  });
});
