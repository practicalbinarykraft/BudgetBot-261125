/**
 * Module-level ref for triggering onboarding from anywhere (e.g., menu).
 * OnboardingDialog registers its open() callback here on mount.
 * NavigationGroups calls openOnboarding() to trigger it.
 */
let _openFn: (() => void) | null = null;

export function registerOnboardingOpen(fn: () => void) {
  _openFn = fn;
}

export function unregisterOnboardingOpen() {
  _openFn = null;
}

export function openOnboarding(): boolean {
  if (_openFn) {
    _openFn();
    return true;
  }
  return false;
}
