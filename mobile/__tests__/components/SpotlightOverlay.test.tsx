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
        "spotlight.skip_flow": "Skip",
        "spotlight.flow.create_wallet.step1": "These are your wallets and balance. Tap here.",
        "spotlight.flow.add_transaction.step1": "Tap here to add a transaction",
        "spotlight.flow.add_transaction.step2": "We have voice input and receipt scanning!",
        "spotlight.flow.add_transaction.step2.try_voice": "Try voice now",
        "spotlight.flow.add_transaction.step2.later": "Can't talk, later",
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
    add_transaction: {
      id: "add_transaction",
      steps: [
        { targetId: "fab_plus_btn", tooltipKey: "spotlight.flow.add_transaction.step1", navigateBefore: "Main", navigateTo: "AddTransaction" },
        {
          targetId: "voice_receipt_row",
          tooltipKey: "spotlight.flow.add_transaction.step2",
          choices: [
            { labelKey: "spotlight.flow.add_transaction.step2.try_voice", navigateTo: "VoiceInput", endFlow: true },
            { labelKey: "spotlight.flow.add_transaction.step2.later" },
          ],
        },
      ],
    },
    skip_test: {
      id: "skip_test",
      steps: [
        { targetId: "missing_target", tooltipKey: "spotlight.flow.create_wallet.step1" },
        { targetId: "add_wallet_btn", tooltipKey: "spotlight.flow.create_wallet.step2" },
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

  it("tapping overlay clears the legacy spotlight", () => {
    const { getByText, queryByText, getByTestId } = render(<SpotlightOverlay />);
    act(() => {
      registeredShow?.("add_transaction");
    });
    expect(getByText("Tap here to add a transaction")).toBeTruthy();
    // Tap the SVG overlay (Pressable wrapping the Svg)
    const svgPath = getByTestId("svg-path");
    fireEvent.press(svgPath.parent!);
    expect(queryByText("Tap here to add a transaction")).toBeNull();
  });

  it("legacy mode does not render Got it button", () => {
    const { queryByText } = render(<SpotlightOverlay />);
    act(() => {
      registeredShow?.("add_transaction");
    });
    expect(queryByText("Got it")).toBeNull();
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

  // ── Choice tests ──

  it("renders choice buttons when step has choices", () => {
    mockGetTargetRect.mockReturnValue({ x: 50, y: 100, width: 200, height: 60 });

    const { getByText } = render(<SpotlightOverlay />);
    const mockNav = { navigate: jest.fn() };
    act(() => {
      registeredFlow?.start("add_transaction", mockNav);
    });
    // Wait for settle to resolve step 0
    act(() => { jest.advanceTimersByTime(600); });
    // Advance past step 0 via flow controller
    act(() => {
      registeredFlow?.advance();
    });

    // Now on step 1: resolve rect for new step
    mockGetTargetRect.mockReturnValue({ x: 30, y: 200, width: 300, height: 50 });
    act(() => { jest.advanceTimersByTime(600); });

    expect(getByText("We have voice input and receipt scanning!")).toBeTruthy();
    expect(getByText("Try voice now")).toBeTruthy();
    expect(getByText("Can't talk, later")).toBeTruthy();
  });

  it("choice with endFlow dismisses flow and navigates", () => {
    mockGetTargetRect.mockReturnValue({ x: 50, y: 100, width: 200, height: 60 });

    const { getByText, queryByText } = render(<SpotlightOverlay />);
    const mockNav = { navigate: jest.fn() };
    act(() => {
      registeredFlow?.start("add_transaction", mockNav);
    });
    act(() => { jest.advanceTimersByTime(600); });
    act(() => {
      registeredFlow?.advance();
    });

    mockGetTargetRect.mockReturnValue({ x: 30, y: 200, width: 300, height: 50 });
    act(() => { jest.advanceTimersByTime(600); });

    // Tap "Try voice now" — should endFlow and navigate to VoiceInput
    fireEvent.press(getByText("Try voice now"));

    expect(mockNav.navigate).toHaveBeenCalledWith("VoiceInput");
    expect(queryByText("We have voice input and receipt scanning!")).toBeNull();
  });

  it("auto-skips step when target is not found within timeout", () => {
    // Step 0 target "missing_target" never registers → should auto-skip to step 1
    // Step 1 target "add_wallet_btn" resolves immediately
    mockGetTargetRect.mockImplementation((id: string) => {
      if (id === "add_wallet_btn") return { x: 50, y: 100, width: 120, height: 40 };
      return null; // "missing_target" never found
    });

    const { getByText } = render(<SpotlightOverlay />);
    act(() => {
      registeredFlow?.start("skip_test", { navigate: jest.fn() });
    });

    // 500ms settle + 3000ms timeout = 3500ms for step 0 to fail
    act(() => { jest.advanceTimersByTime(3600); });

    // After auto-skip, step 1 should resolve (500ms settle)
    act(() => { jest.advanceTimersByTime(600); });

    // Should now show step 1 tooltip
    expect(getByText("spotlight.flow.create_wallet.step2")).toBeTruthy();
  });

  it("navigateBefore navigates before showing the first step", () => {
    mockGetTargetRect.mockReturnValue({ x: 50, y: 100, width: 200, height: 60 });

    render(<SpotlightOverlay />);
    const mockNav = { navigate: jest.fn() };
    act(() => {
      registeredFlow?.start("add_transaction", mockNav);
    });

    // navigateBefore="Main" should have been called
    expect(mockNav.navigate).toHaveBeenCalledWith("Main");
  });
});
