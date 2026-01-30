import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { useTranslation } from "@/i18n/context";

export type SortOption = "priority" | "amount" | "date";

interface WishlistFiltersProps {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
}

export function WishlistFilters({ sortBy, onSortChange }: WishlistFiltersProps) {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-40" data-testid="select-wishlist-sort">
          <SelectValue placeholder={t("wishlist.sort_by")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="priority" data-testid="sort-priority">
            {t("wishlist.sort_priority")}
          </SelectItem>
          <SelectItem value="amount" data-testid="sort-amount">
            {t("wishlist.sort_amount")}
          </SelectItem>
          <SelectItem value="date" data-testid="sort-date">
            {t("wishlist.sort_date")}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
