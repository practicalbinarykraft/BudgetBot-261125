import { WishlistItemWithPrediction } from "@/types/goal-prediction";
import { SortOption } from "@/components/wishlist/wishlist-filters";

const priorityOrder = { high: 1, medium: 2, low: 3 };

export function sortWishlist(
  items: WishlistItemWithPrediction[],
  sortBy: SortOption
): WishlistItemWithPrediction[] {
  const sorted = [...items];

  switch (sortBy) {
    case "priority":
      return sorted.sort((a, b) => {
        const orderA = priorityOrder[a.priority as keyof typeof priorityOrder];
        const orderB = priorityOrder[b.priority as keyof typeof priorityOrder];
        return orderA - orderB;
      });

    case "amount":
      return sorted.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));

    case "date":
      return sorted.sort((a, b) => b.id - a.id);

    default:
      return sorted;
  }
}
