/**
 * Module-level ref for triggering the spotlight overlay from non-hook contexts.
 * SpotlightOverlay registers its show callback here on mount.
 */

import type { LayoutRect } from "./view-all-ref";
import { SPOTLIGHT_FLOWS } from "../tutorial/spotlight/flows";

// ─── Legacy spotlight (single target) ───────────────────────────────

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

// ─── Target registry (for flow mode) ───────────────────────────────

const _targetRects = new Map<string, LayoutRect>();
const _targetChangeListeners = new Set<(id: string) => void>();

export function registerSpotlightTarget(id: string, rect: LayoutRect) {
  _targetRects.set(id, rect);
  _targetChangeListeners.forEach((fn) => fn(id));
}

export function unregisterSpotlightTarget(id: string) {
  _targetRects.delete(id);
}

export function getSpotlightTargetRect(id: string): LayoutRect | null {
  return _targetRects.get(id) ?? null;
}

export function onSpotlightTargetChange(fn: (id: string) => void): () => void {
  _targetChangeListeners.add(fn);
  return () => {
    _targetChangeListeners.delete(fn);
  };
}

// ─── Flow control ───────────────────────────────────────────────────

interface FlowController {
  start: (flowId: string, navigation: any) => void;
  advance: () => void;
  dismiss: () => void;
}

let _flowController: FlowController | null = null;

export function registerSpotlightFlow(fns: FlowController) {
  _flowController = fns;
}

export function unregisterSpotlightFlow() {
  _flowController = null;
}

export function startSpotlightFlow(flowId: string, navigation: any): boolean {
  const flow = SPOTLIGHT_FLOWS[flowId];
  if (!flow || !_flowController) return false;
  _flowController.start(flowId, navigation);
  return true;
}

export function advanceSpotlight() {
  _flowController?.advance();
}

export function dismissSpotlightFlow() {
  _flowController?.dismiss();
}
