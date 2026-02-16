/**
 * Module-level ref for triggering the spotlight overlay from non-hook contexts.
 * SpotlightOverlay registers its show callback here on mount.
 */

export type SpotlightTarget =
  | "add_transaction"
  | "voice_input"
  | "receipt_scan"
  | "view_transactions";

let _showFn: ((targetId: SpotlightTarget) => void) | null = null;

export function registerSpotlightShow(fn: (targetId: SpotlightTarget) => void) {
  _showFn = fn;
}

export function unregisterSpotlightShow() {
  _showFn = null;
}

export function showSpotlight(targetId: SpotlightTarget): boolean {
  if (_showFn) {
    _showFn(targetId);
    return true;
  }
  return false;
}
