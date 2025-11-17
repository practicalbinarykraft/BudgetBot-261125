import { WishlistItemWithPrediction } from "@/types/goal-prediction";

export interface NormalizedGoalMarker {
  id: string;
  name: string;
  amount: string;
  targetDate: string;
  status: string;
  priority: string;
  prediction: {
    monthsToAfford: number | null;
    affordableDate: string | null;
  };
}

export interface TrendGoal {
  id: number;
  name: string;
  amount: string | number;
  targetDate: string;
  status?: string;
  priority?: string;
  prediction?: {
    monthsToAfford: number | null;
    affordableDate: string | null;
  } | null;
}

export function normalizeTrendGoals(trendGoals: TrendGoal[]): NormalizedGoalMarker[] {
  return trendGoals
    .filter(goal => goal.prediction?.affordableDate)
    .map(goal => ({
      id: String(goal.id),
      name: goal.name,
      amount: String(goal.amount),
      targetDate: goal.targetDate,
      status: goal.status || "planned",
      priority: goal.priority || "low",
      prediction: goal.prediction!,
    }));
}

export function normalizeWishlistGoals(wishlistPredictions: WishlistItemWithPrediction[]): NormalizedGoalMarker[] {
  return wishlistPredictions
    .filter(item => item.prediction?.affordableDate)
    .map(item => ({
      id: `w-${item.id}`,
      name: item.name,
      amount: String(item.amount),
      targetDate: item.targetDate || "",
      status: "wishlist",
      priority: item.priority || "medium",
      prediction: item.prediction!,
    }));
}
