/**
 * Utility Functions for Assets Routes
 *
 * Helper functions for asset value calculations
 * Junior-Friendly: <70 lines, focused on calculation logic
 */

/**
 * Calculate asset value at a specific date
 *
 * Uses historical valuations or appreciation/depreciation rates
 * Optimized: valuations are passed as parameter (pre-sorted DESC)
 *
 * @param asset - Asset object with current/purchase values and rates
 * @param targetDate - Date to calculate value for (ISO string)
 * @param valuations - Array of valuations (sorted DESC by date)
 * @returns Calculated value in USD
 */
export function calculateAssetValueAtDate(asset: any, targetDate: string, valuations: any[]): number {
  const target = new Date(targetDate);

  // Find first valuation <= target date (array already sorted DESC)
  // O(V) instead of O(V log V) - no re-sorting needed
  const relevantValuation = valuations.find(v =>
    new Date(v.valuationDate) <= target
  );

  if (relevantValuation) {
    // If historical valuation exists - use it
    return parseFloat(relevantValuation.value as unknown as string);
  }

  // No historical valuations - calculate based on appreciation/depreciation rate
  // Determine purchase date (fallback: first valuation or createdAt)
  const firstValuationDate = valuations.length > 0
    ? valuations[valuations.length - 1].valuationDate
    : null;
  const purchaseDate = asset.purchaseDate
    ? new Date(asset.purchaseDate)
    : (firstValuationDate ? new Date(firstValuationDate) : new Date(asset.createdAt));

  const purchaseValue = asset.purchasePrice
    ? parseFloat(asset.purchasePrice as unknown as string)
    : parseFloat(asset.currentValue as unknown as string);

  // If target date is before purchase - return 0
  if (target < purchaseDate) {
    return 0;
  }

  // Calculate years elapsed from purchase to target date
  const yearsElapsed = (target.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

  // Apply appreciation/depreciation rate
  if (asset.appreciationRate) {
    const rate = parseFloat(asset.appreciationRate as unknown as string) / 100;
    return purchaseValue * Math.pow(1 + rate, yearsElapsed);
  }

  if (asset.depreciationRate) {
    const rate = parseFloat(asset.depreciationRate as unknown as string) / 100;
    return purchaseValue * Math.pow(1 - rate, yearsElapsed);
  }

  // If no rate change - use currentValue (reflects latest calibrations)
  // instead of purchaseValue (may be outdated)
  return parseFloat(asset.currentValue as unknown as string);
}
