/**
 * Module-level ref for storing the "View all" button position.
 * RecentTransactionsSection measures and stores it; SpotlightOverlay reads it.
 */

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

let _rect: LayoutRect | null = null;

export function setViewAllRect(rect: LayoutRect) {
  _rect = rect;
}

export function getViewAllRect(): LayoutRect | null {
  return _rect;
}
