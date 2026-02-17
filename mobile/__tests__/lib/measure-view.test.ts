import { measureView, type ViewRect } from "../../lib/measure-view";

// Mock Platform
let mockPlatformOS = "ios";
jest.mock("react-native", () => ({
  Platform: { get OS() { return mockPlatformOS; } },
}));

describe("measureView", () => {
  beforeEach(() => {
    mockPlatformOS = "ios";
  });

  it("returns null when ref.current is null", async () => {
    const ref = { current: null };
    const result = await measureView(ref as any);
    expect(result).toBeNull();
  });

  it("calls measureInWindow on native", async () => {
    mockPlatformOS = "ios";
    const mockRect: ViewRect = { x: 10, y: 20, width: 100, height: 50 };
    const mockMeasureInWindow = jest.fn((cb: Function) =>
      cb(mockRect.x, mockRect.y, mockRect.width, mockRect.height),
    );
    const ref = { current: { measureInWindow: mockMeasureInWindow } };

    const result = await measureView(ref as any);
    expect(mockMeasureInWindow).toHaveBeenCalled();
    expect(result).toEqual(mockRect);
  });

  it("returns null when native measureInWindow returns 0x0", async () => {
    mockPlatformOS = "ios";
    const mockMeasureInWindow = jest.fn((cb: Function) => cb(0, 0, 0, 0));
    const ref = { current: { measureInWindow: mockMeasureInWindow } };

    const result = await measureView(ref as any);
    expect(result).toBeNull();
  });

  it("calls measure on web (RNW path)", async () => {
    mockPlatformOS = "web";
    const mockRect: ViewRect = { x: 15, y: 25, width: 200, height: 40 };
    const mockMeasure = jest.fn((cb: Function) =>
      cb(0, 0, mockRect.width, mockRect.height, mockRect.x, mockRect.y),
    );
    const ref = { current: { measure: mockMeasure } };

    const result = await measureView(ref as any);
    expect(mockMeasure).toHaveBeenCalled();
    expect(result).toEqual(mockRect);
  });

  it("falls back to getBoundingClientRect on web when measure unavailable", async () => {
    mockPlatformOS = "web";
    const mockRect = { x: 30, y: 40, width: 120, height: 60 };
    const ref = {
      current: {
        measure: undefined,
        getBoundingClientRect: jest.fn(() => mockRect),
      },
    };

    const result = await measureView(ref as any);
    expect(result).toEqual(mockRect);
  });

  it("returns null on web when nothing works", async () => {
    mockPlatformOS = "web";
    const ref = { current: {} };
    const result = await measureView(ref as any);
    expect(result).toBeNull();
  });
});
