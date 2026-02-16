/**
 * Module-level ref for showing the reward modal from non-hook contexts.
 * RewardModal registers its show callback here on mount.
 */

export interface RewardData {
  creditsAwarded: number;
  balanceBefore: number;
  balanceAfter: number;
}

let _showFn: ((data: RewardData) => void) | null = null;

export function registerRewardModal(fn: (data: RewardData) => void) {
  _showFn = fn;
}

export function unregisterRewardModal() {
  _showFn = null;
}

export function showRewardModal(data: RewardData) {
  _showFn?.(data);
}
