import {
  registerSpotlightTarget,
  unregisterSpotlightTarget,
  getSpotlightTargetRect,
  onSpotlightTargetChange,
  registerSpotlightFlow,
  unregisterSpotlightFlow,
  startSpotlightFlow,
  advanceSpotlight,
  dismissSpotlightFlow,
} from "../../lib/spotlight-ref";

// Mock the SPOTLIGHT_FLOWS import used by startSpotlightFlow
jest.mock("../../tutorial/spotlight/flows", () => ({
  SPOTLIGHT_FLOWS: {
    create_wallet: {
      id: "create_wallet",
      steps: [
        { targetId: "wallet_balance", tooltipKey: "step1" },
        { targetId: "add_wallet_btn", tooltipKey: "step2" },
      ],
    },
  },
}));

describe("spotlight-ref target registry", () => {
  afterEach(() => {
    unregisterSpotlightTarget("test_target");
  });

  it("registers and retrieves a target rect", () => {
    expect(getSpotlightTargetRect("test_target")).toBeNull();
    registerSpotlightTarget("test_target", { x: 10, y: 20, width: 100, height: 50 });
    expect(getSpotlightTargetRect("test_target")).toEqual({ x: 10, y: 20, width: 100, height: 50 });
  });

  it("unregisters a target", () => {
    registerSpotlightTarget("test_target", { x: 10, y: 20, width: 100, height: 50 });
    unregisterSpotlightTarget("test_target");
    expect(getSpotlightTargetRect("test_target")).toBeNull();
  });

  it("notifies change listeners", () => {
    const listener = jest.fn();
    const unsub = onSpotlightTargetChange(listener);
    registerSpotlightTarget("test_target", { x: 0, y: 0, width: 50, height: 50 });
    expect(listener).toHaveBeenCalledWith("test_target");
    unsub();
    registerSpotlightTarget("test_target", { x: 1, y: 1, width: 50, height: 50 });
    expect(listener).toHaveBeenCalledTimes(1); // no second call after unsub
  });
});

describe("spotlight-ref flow control", () => {
  const mockStart = jest.fn();
  const mockAdvance = jest.fn();
  const mockDismiss = jest.fn();
  const mockNav = { navigate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    registerSpotlightFlow({ start: mockStart, advance: mockAdvance, dismiss: mockDismiss });
  });

  afterEach(() => {
    unregisterSpotlightFlow();
  });

  it("starts a flow", () => {
    const result = startSpotlightFlow("create_wallet", mockNav);
    expect(result).toBe(true);
    expect(mockStart).toHaveBeenCalledWith("create_wallet", mockNav);
  });

  it("returns false for unknown flow", () => {
    const result = startSpotlightFlow("unknown_flow", mockNav);
    expect(result).toBe(false);
    expect(mockStart).not.toHaveBeenCalled();
  });

  it("advances spotlight", () => {
    advanceSpotlight();
    expect(mockAdvance).toHaveBeenCalled();
  });

  it("dismisses flow", () => {
    dismissSpotlightFlow();
    expect(mockDismiss).toHaveBeenCalled();
  });

  it("returns false when no controller registered", () => {
    unregisterSpotlightFlow();
    const result = startSpotlightFlow("create_wallet", mockNav);
    expect(result).toBe(false);
  });
});
