import { computeTooltipPosition } from "../../components/financial-trend-chart/tooltipPosition";

const base = {
  pointsCount: 50,
  chartWidth: 300,
  chartHeight: 200,
  tooltipWidth: 150,
  tooltipHeight: 90,
} as const;

describe("computeTooltipPosition", () => {
  // --- side ---

  it("places tooltip to the right when pointer is in the middle", () => {
    const result = computeTooltipPosition({ ...base, pointerIndex: 20 });
    expect(result.side).toBe("right");

    // pointerX ≈ 10 + 20*(280/49) ≈ 124
    // left should be pointerX + offset
    expect(result.left).toBeGreaterThan(120);
  });

  it("flips tooltip to the left when pointer is near the right edge", () => {
    const result = computeTooltipPosition({ ...base, pointerIndex: 45 });
    expect(result.side).toBe("left");

    // pointerX ≈ 10 + 45*(280/49) ≈ 267
    expect(result.left).toBeLessThan(267);
  });

  it("keeps tooltip on the right when pointer is at the left edge", () => {
    const result = computeTooltipPosition({ ...base, pointerIndex: 0 });
    expect(result.side).toBe("right");
    expect(result.left).toBeGreaterThanOrEqual(8); // >= padding
  });

  // --- bounds ---

  it("tooltip stays within chart horizontally", () => {
    for (const idx of [0, 10, 25, 40, 49]) {
      const r = computeTooltipPosition({ ...base, pointerIndex: idx });
      expect(r.left).toBeGreaterThanOrEqual(8);
      expect(r.left + base.tooltipWidth).toBeLessThanOrEqual(base.chartWidth - 8);
    }
  });

  it("tooltip stays within chart vertically", () => {
    const result = computeTooltipPosition({ ...base, pointerIndex: 25 });
    expect(result.top).toBeGreaterThanOrEqual(8);
    expect(result.top + base.tooltipHeight).toBeLessThanOrEqual(base.chartHeight - 8);
  });

  it("clamps top to at least padding even when chart is tight", () => {
    const result = computeTooltipPosition({
      ...base,
      pointerIndex: 25,
      chartHeight: 100,
      tooltipHeight: 90,
    });
    // When chart barely fits the tooltip, top is clamped to padding
    expect(result.top).toBeGreaterThanOrEqual(8);
  });

  it("tooltip stays within chart when there is enough space", () => {
    const result = computeTooltipPosition({
      ...base,
      pointerIndex: 25,
      chartHeight: 200,
      tooltipHeight: 80,
    });
    expect(result.top).toBeGreaterThanOrEqual(8);
    expect(result.top + 80).toBeLessThanOrEqual(200 - 8);
  });

  // --- edge cases ---

  it("handles single data point gracefully", () => {
    const result = computeTooltipPosition({ ...base, pointsCount: 1, pointerIndex: 0 });
    expect(result.side).toBe("right");
    expect(result.left).toBeGreaterThanOrEqual(8);
  });

  it("respects custom offset and padding", () => {
    const result = computeTooltipPosition({
      ...base,
      pointerIndex: 20,
      offset: 20,
      padding: 12,
    });
    expect(result.left).toBeGreaterThanOrEqual(12);
  });
});
