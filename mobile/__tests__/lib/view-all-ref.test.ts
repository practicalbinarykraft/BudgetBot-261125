import { setViewAllRect, getViewAllRect } from "../../lib/view-all-ref";

describe("view-all-ref", () => {
  it("returns null when no rect is set", () => {
    // Reset module state
    jest.resetModules();
    const { getViewAllRect: get } = require("../../lib/view-all-ref");
    expect(get()).toBeNull();
  });

  it("round-trips set/get", () => {
    const rect = { x: 100, y: 200, width: 80, height: 30 };
    setViewAllRect(rect);
    expect(getViewAllRect()).toEqual(rect);
  });

  it("overwrites previous value", () => {
    setViewAllRect({ x: 10, y: 20, width: 30, height: 40 });
    const updated = { x: 50, y: 60, width: 70, height: 80 };
    setViewAllRect(updated);
    expect(getViewAllRect()).toEqual(updated);
  });
});
