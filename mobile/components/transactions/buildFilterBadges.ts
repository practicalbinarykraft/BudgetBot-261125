import type { TransactionFilters, FilterBadge } from "../../hooks/useTransactionsScreen";
import type { Category, PersonalTag } from "../../types";

export function buildFilterBadges(
  filters: TransactionFilters,
  categoryMap: Record<number, Category>,
  tagMap: Record<number, PersonalTag>,
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilters>>
): FilterBadge[] {
  const badges: FilterBadge[] = [];

  filters.types.forEach((type) => {
    badges.push({
      key: `type-${type}`,
      label: `Type: ${type === "income" ? "Income" : "Expense"}`,
      onRemove: () =>
        setFilters((f) => ({ ...f, types: f.types.filter((t) => t !== type) })),
    });
  });

  filters.categoryIds.forEach((id) => {
    const cat = categoryMap[id];
    if (cat) {
      badges.push({
        key: `cat-${id}`,
        label: `Category: ${cat.name}`,
        onRemove: () =>
          setFilters((f) => ({ ...f, categoryIds: f.categoryIds.filter((c) => c !== id) })),
      });
    }
  });

  filters.personalTagIds.forEach((id) => {
    const tag = tagMap[id];
    if (tag) {
      badges.push({
        key: `tag-${id}`,
        label: `Tag: ${tag.name}`,
        onRemove: () =>
          setFilters((f) => ({ ...f, personalTagIds: f.personalTagIds.filter((t) => t !== id) })),
      });
    }
  });

  if (filters.from) {
    badges.push({
      key: "from",
      label: `From: ${filters.from}`,
      onRemove: () => setFilters((f) => ({ ...f, from: "" })),
    });
  }

  if (filters.to) {
    badges.push({
      key: "to",
      label: `To: ${filters.to}`,
      onRemove: () => setFilters((f) => ({ ...f, to: "" })),
    });
  }

  return badges;
}
