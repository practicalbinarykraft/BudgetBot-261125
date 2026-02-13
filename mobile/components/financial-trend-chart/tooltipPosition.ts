/**
 * Pure function to compute tooltip position relative to the chart data area.
 * Used by FinancialTrendChart and FullscreenChartScreen.
 */

export interface ComputeTooltipPositionParams {
  /** Index of the active pointer in the data array */
  pointerIndex: number;
  /** Total number of data points */
  pointsCount: number;
  /** Width of the chart data area (excluding y-axis) */
  chartWidth: number;
  /** Height of the chart data area */
  chartHeight: number;
  /** Tooltip bubble width */
  tooltipWidth: number;
  /** Tooltip bubble height */
  tooltipHeight: number;
  /** Chart initialSpacing (default 10) */
  initialSpacing?: number;
  /** Chart endSpacing (default 10) */
  endSpacing?: number;
  /** Gap between pointer line and tooltip edge (default 14) */
  offset?: number;
  /** Min distance from chart edge (default 8) */
  padding?: number;
}

export interface TooltipPositionResult {
  /** Absolute left within chart data area */
  left: number;
  /** Absolute top within chart data area */
  top: number;
  /** Which side of the pointer line the tooltip is on */
  side: "left" | "right";
}

export function computeTooltipPosition({
  pointerIndex,
  pointsCount,
  chartWidth,
  chartHeight,
  tooltipWidth,
  tooltipHeight,
  initialSpacing = 10,
  endSpacing = 10,
  offset = 14,
  padding = 8,
}: ComputeTooltipPositionParams): TooltipPositionResult {
  // X of the pointer line in chart data coordinates
  const drawableWidth = chartWidth - initialSpacing - endSpacing;
  const step = pointsCount > 1 ? drawableWidth / (pointsCount - 1) : 0;
  const pointerX = initialSpacing + pointerIndex * step;

  // Default: tooltip to the right of the pointer line
  let side: "left" | "right" = "right";
  let left = pointerX + offset;

  // Flip to left if it overflows the right edge
  if (left + tooltipWidth > chartWidth - padding) {
    side = "left";
    left = pointerX - offset - tooltipWidth;
  }

  // Clamp horizontally
  left = Math.max(padding, Math.min(left, chartWidth - tooltipWidth - padding));

  // Vertical: center in chart area, clamped to stay inside
  let top = (chartHeight - tooltipHeight) / 2;
  top = Math.max(padding, Math.min(top, chartHeight - tooltipHeight - padding));

  return { left, top, side };
}
