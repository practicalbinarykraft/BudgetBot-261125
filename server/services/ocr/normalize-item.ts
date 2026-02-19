/**
 * Normalize item name for price comparison across receipts.
 *
 * Examples:
 *   "Orange Juice 1L" → "orange juice"
 *   "Молоко 2.5%"     → "молоко"
 */
export function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[0-9]+\s*(ml|l|kg|g|pcs|шт|л|кг|г)/gi, '') // remove sizes/volumes
    .replace(/[^a-zа-яё\s]/g, '')  // keep only letters and spaces
    .replace(/\s+/g, ' ')          // collapse multiple spaces
    .trim();
}
