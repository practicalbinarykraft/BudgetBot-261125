/**
 * Module-level ref for showing tutorial reward toasts from non-hook contexts.
 * TutorialDialog registers its toast callback here on mount.
 */
let _showFn: ((credits: number) => void) | null = null;

export function registerTutorialToast(fn: (credits: number) => void) {
  _showFn = fn;
}

export function unregisterTutorialToast() {
  _showFn = null;
}

export function showTutorialRewardToast(credits: number) {
  _showFn?.(credits);
}
