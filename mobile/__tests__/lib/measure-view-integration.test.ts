/**
 * Integration test: measureView is callable from RecentTransactionsSection context.
 * Verifies the module exports and that web fallback chain works end-to-end.
 */
import { measureView, type ViewRect } from "../../lib/measure-view";

let mockPlatformOS = "web";
jest.mock("react-native", () => ({
  Platform: { get OS() { return mockPlatformOS; } },
}));

describe("measureView integration", () => {
  beforeEach(() => {
    mockPlatformOS = "web";
  });

  it("exports measureView function", () => {
    expect(typeof measureView).toBe("function");
  });

  it("exports ViewRect type (compile-time check)", () => {
    const rect: ViewRect = { x: 0, y: 0, width: 100, height: 50 };
    expect(rect).toBeDefined();
  });

  it("web: measure() → getBoundingClientRect → null fallback chain", async () => {
    // Step 1: measure() works → returns measure result
    const measureRef = {
      current: {
        measure: jest.fn((cb: Function) => cb(0, 0, 200, 100, 10, 20)),
      },
    };
    const r1 = await measureView(measureRef as any);
    expect(r1).toEqual({ x: 10, y: 20, width: 200, height: 100 });

    // Step 2: no measure, has getBoundingClientRect → returns DOMRect
    const domRef = {
      current: {
        getBoundingClientRect: jest.fn(() => ({ x: 5, y: 15, width: 80, height: 40 })),
      },
    };
    const r2 = await measureView(domRef as any);
    expect(r2).toEqual({ x: 5, y: 15, width: 80, height: 40 });

    // Step 3: nothing available → null
    const emptyRef = { current: {} };
    const r3 = await measureView(emptyRef as any);
    expect(r3).toBeNull();
  });

  it("native: measureInWindow works", async () => {
    mockPlatformOS = "ios";
    const ref = {
      current: {
        measureInWindow: jest.fn((cb: Function) => cb(10, 20, 300, 150)),
      },
    };
    const result = await measureView(ref as any);
    expect(result).toEqual({ x: 10, y: 20, width: 300, height: 150 });
  });
});
