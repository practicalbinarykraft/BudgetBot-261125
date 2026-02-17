import type { LayoutRect } from "../../lib/view-all-ref";

export const CUTOUT_PADDING = 10;
export const CUTOUT_RADIUS = 14;
export const STROKE_WIDTH = 2.5;
export const ACCENT = "#3b82f6";

export function roundRect(rect: LayoutRect): LayoutRect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

export function buildCircleCutoutPath(
  sw: number, sh: number, cx: number, cy: number, r: number,
): string {
  const outer = `M0,0 H${sw} V${sh} H0 Z`;
  const circle =
    `M${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy} ` +
    `A${r},${r} 0 1,0 ${cx - r},${cy} Z`;
  return `${outer} ${circle}`;
}

export function buildRoundedRectCutoutPath(
  sw: number, sh: number, rect: LayoutRect,
): string {
  const x = rect.x - CUTOUT_PADDING;
  const y = rect.y - CUTOUT_PADDING;
  const w = rect.width + CUTOUT_PADDING * 2;
  const h = rect.height + CUTOUT_PADDING * 2;
  const r = CUTOUT_RADIUS;

  const outer = `M0,0 H${sw} V${sh} H0 Z`;
  const inner =
    `M${x + r},${y}` +
    ` H${x + w - r}` +
    ` Q${x + w},${y} ${x + w},${y + r}` +
    ` V${y + h - r}` +
    ` Q${x + w},${y + h} ${x + w - r},${y + h}` +
    ` H${x + r}` +
    ` Q${x},${y + h} ${x},${y + h - r}` +
    ` V${y + r}` +
    ` Q${x},${y} ${x + r},${y}` +
    ` Z`;

  return `${outer} ${inner}`;
}
