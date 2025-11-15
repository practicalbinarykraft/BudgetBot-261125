/**
 * AI Goal Prediction Response Type
 * Matches server/services/goal-predictor.service.ts output
 */
export interface GoalPrediction {
  canAfford: boolean;
  freeCapital: number;
  monthsToAfford: number | null;
  affordableDate: string | null;
}

/**
 * Wishlist Item with AI Prediction
 * Extended type for GET /api/wishlist response
 */
export interface WishlistItemWithPrediction {
  id: number;
  userId: number;
  name: string;
  amount: string;
  targetDate: string | null;
  priority: string;
  isPurchased: boolean;
  prediction: GoalPrediction | null;
}
