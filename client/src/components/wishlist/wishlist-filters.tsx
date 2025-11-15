import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

export type SortOption = "priority" | "amount" | "date";

interface WishlistFiltersProps {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
}

export function WishlistFilters({ sortBy, onSortChange }: WishlistFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-40" data-testid="select-wishlist-sort">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="priority" data-testid="sort-priority">
            Priority
          </SelectItem>
          <SelectItem value="amount" data-testid="sort-amount">
            Amount
          </SelectItem>
          <SelectItem value="date" data-testid="sort-date">
            Date Added
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
