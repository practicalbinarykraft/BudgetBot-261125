/**
 * Module-level ref for triggering the tutorial dialog from anywhere (e.g., menu).
 * TutorialDialog registers its open() callback here on mount.
 */
let _openFn: (() => void) | null = null;

export function registerTutorialOpen(fn: () => void) {
  _openFn = fn;
}

export function unregisterTutorialOpen() {
  _openFn = null;
}

export function openTutorial(): boolean {
  if (_openFn) {
    _openFn();
    return true;
  }
  return false;
}
