import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";

jest.mock("react-native-svg", () => {
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: (props: any) => <View {...props} />,
    Path: (props: any) => <View testID="svg-path" {...props} />,
    Rect: (props: any) => <View testID="svg-rect" {...props} />,
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
        "spotlight.skip_flow": "Skip",
        "spotlight.flow.create_wallet.step1": "These are your wallets and balance. Tap here.",
      };
      return map[key] ?? key;
    },
  }),
}));

jest.mock("../../lib/view-all-ref", () => ({
  getViewAllRect: () => null,
}));

let registeredShow: ((targetId: string) => void) | null = null;
let registeredFlow: { start: Function; advance: Function; dismiss: Function } | null = null;
const mockGetTargetRect = jest.fn().mockReturnValue(null);
const mockOnChange = jest.fn().mockReturnValue(() => {});

jest.mock("../../lib/spotlight-ref", () => ({
  registerSpotlightShow: (fn: any) => { registeredShow = fn; },
  unregisterSpotlightShow: () => { registeredShow = null; },
  registerSpotlightFlow: (fns: any) => { registeredFlow = fns; },
  unregisterSpotlightFlow: () => { registeredFlow = null; },
  getSpotlightTargetRect: (...args: any[]) => mockGetTargetRect(...args),
  onSpotlightTargetChange: (...args: any[]) => mockOnChange(...args),
}));

jest.mock("../../tutorial/spotlight/flows", () => ({
  SPOTLIGHT_FLOWS: {
    create_wallet: {
      id: "create_wallet",
      steps: [
        { targetId: "wallet_balance", tooltipKey: "spotlight.flow.create_wallet.step1", navigateTo: "Wallets" },
        { targetId: "add_wallet_btn", tooltipKey: "spotlight.flow.create_wallet.step2", navigateTo: "AddWallet" },
      ],
    },
  },
}));

import SpotlightOverlay from "../../components/SpotlightOverlay";

describe("SpotlightOverlay", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    registeredShow = null;
    registeredFlow = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ── Legacy tests ──

  it("is hidden when no target", () => {
    const { queryByTestId } = render(<SpotlightOverlay />);
    expect(queryByTestId("svg-path")).toBeNull();
  });

  it("renders SVG when target is set", () => {
    const { getByText } = render(<SpotlightOverlay />);
    act(() => {
      registeredShow?.("add_transaction");
    });
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

  // ── Flow tests ──

  it("registers flow controller on mount", () => {
    render(<SpotlightOverlay />);
    expect(registeredFlow).not.toBeNull();
    expect(registeredFlow?.start).toBeDefined();
    expect(registeredFlow?.advance).toBeDefined();
    expect(registeredFlow?.dismiss).toBeDefined();
  });

  it("renders flow tooltip when flow started and rect available", () => {
    mockGetTargetRect.mockReturnValue({ x: 50, y: 100, width: 120, height: 40 });

    const { getByText } = render(<SpotlightOverlay />);
    act(() => {
      registeredFlow?.start("create_wallet", { navigate: jest.fn() });
    });
    // Wait for settle delay (500ms) before rect is resolved
    act(() => { jest.advanceTimersByTime(600); });

    expect(getByText("These are your wallets and balance. Tap here.")).toBeTruthy();
    expect(getByText("Skip")).toBeTruthy();
  });

  it("skip dismisses flow", () => {
    mockGetTargetRect.mockReturnValue({ x: 50, y: 100, width: 120, height: 40 });

    const { getByText, queryByText } = render(<SpotlightOverlay />);
    act(() => {
      registeredFlow?.start("create_wallet", { navigate: jest.fn() });
    });
    // Wait for settle delay
    act(() => { jest.advanceTimersByTime(600); });

    fireEvent.press(getByText("Skip"));
    // dismissFlow uses a 200ms fade-out animation before clearing state
    act(() => { jest.advanceTimersByTime(300); });
    expect(queryByText("These are your wallets and balance. Tap here.")).toBeNull();
  });
});
