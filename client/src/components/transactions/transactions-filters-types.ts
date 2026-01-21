export interface TransactionFilters {
  categoryIds?: number[];
  personalTagIds?: number[];
  types?: ('income' | 'expense')[];
  from?: string | null;
  to?: string | null;
}
