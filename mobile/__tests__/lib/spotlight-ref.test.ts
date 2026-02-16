import {
  registerSpotlightShow,
  unregisterSpotlightShow,
  showSpotlight,
} from "../../lib/spotlight-ref";

describe("spotlight-ref", () => {
  afterEach(() => unregisterSpotlightShow());

  it("returns true and calls fn when registered", () => {
    const fn = jest.fn();
    registerSpotlightShow(fn);
    const result = showSpotlight("add_transaction");
    expect(result).toBe(true);
    expect(fn).toHaveBeenCalledWith("add_transaction");
  });

  it("returns false when no fn registered", () => {
    const result = showSpotlight("voice_input");
    expect(result).toBe(false);
  });

  it("does not call fn after unregister", () => {
    const fn = jest.fn();
    registerSpotlightShow(fn);
    unregisterSpotlightShow();
    const result = showSpotlight("receipt_scan");
    expect(result).toBe(false);
    expect(fn).not.toHaveBeenCalled();
  });
});
