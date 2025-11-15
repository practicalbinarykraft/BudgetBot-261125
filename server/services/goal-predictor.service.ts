import { addMonths, format } from 'date-fns';
import { getMonthlyStats, getTotalBudgetLimits, MonthlyStats } from './budget-stats.service';

/**
 * Goal Predictor Service
 * 
 * Calculates when user can afford wishlist items based on:
 * - 3-month rolling average of income/expenses
 * - Free capital (income - expenses - budget commitments)
 * - Realistic affordability timeline
 * 
 * SIMPLIFIED: Returns single prediction matching frontend interface
 */

export interface GoalPrediction {
  canAfford: boolean;
  freeCapital: number;
  monthsToAfford: number | null;
  affordableDate: string | null;
}

/**
 * Calculate when user can afford a goal
 * 
 * Logic:
 * 1. Monthly free capital = income - expenses (3-month average)
 * 2. If free capital <= 0: cannot afford (expenses exceed income)
 * 3. Otherwise: monthsToAfford = ceil(goalAmount / freeCapital)
 * 
 * Note: We don't have accumulated savings data, so predictions
 * are based on monthly surplus accumulation timeline.
 * 
 * Guards:
 * - New users with no transactions get freeCapital = 0
 * - NaN/Infinity protected with safe fallbacks
 */
function calculatePrediction(
  goalAmount: number,
  stats: MonthlyStats
): GoalPrediction {
  const { freeCapital } = stats;

  // Cannot afford: negative or zero free capital
  if (freeCapital <= 0) {
    return {
      canAfford: false,
      freeCapital,
      monthsToAfford: null,
      affordableDate: null,
    };
  }

  // Calculate months needed based on monthly surplus
  const monthsToAfford = Math.ceil(goalAmount / freeCapital);
  const affordableDate = format(
    addMonths(new Date(), monthsToAfford),
    'yyyy-MM-dd'
  );

  // canAfford=false because we don't track accumulated savings
  // monthsToAfford indicates timeline to accumulate from current surplus
  return {
    canAfford: false,
    freeCapital,
    monthsToAfford,
    affordableDate,
  };
}

/**
 * Predict goal with pre-computed stats (avoid N+1 queries)
 * 
 * Use this in routes when processing multiple items:
 * 
 * @example
 * const stats = await getMonthlyStats(userId);
 * const budgetLimits = await getTotalBudgetLimits(userId);
 * items.map(item => predictGoalWithStats(item.amount, stats, budgetLimits))
 * 
 * Budget-aware logic:
 * - If user has budget limits, use MINIMUM of:
 *   1. Actual free capital (income - expenses)
 *   2. Budget-constrained capital (income - budget limits)
 * - This provides conservative estimates when budgets are stricter
 * - Ignores unrealistic budgets (budgetLimits > income)
 * 
 * Examples:
 * 1. income=5000, expenses=3500, budgets=3000
 *    → min(1500, 2000) = 1500 (actual is tighter)
 * 
 * 2. income=5000, expenses=3500, budgets=4000
 *    → min(1500, 1000) = 1000 (budgets stricter, use that)
 * 
 * 3. income=5000, expenses=3500, budgets=6000
 *    → min(1500, -1000) → 1500 (ignore unrealistic budgets)
 */
export function predictGoalWithStats(
  goalAmount: number,
  stats: MonthlyStats,
  budgetLimits: number
): GoalPrediction {
  let adjustedStats = stats;
  
  // Apply budget-aware adjustment if user has set limits
  if (budgetLimits > 0 && budgetLimits < stats.income) {
    const budgetConstrainedCapital = stats.income - budgetLimits;
    const conservativeFreeCapital = Math.min(
      stats.freeCapital,
      budgetConstrainedCapital
    );
    
    adjustedStats = {
      ...stats,
      freeCapital: conservativeFreeCapital,
    };
  }

  return calculatePrediction(goalAmount, adjustedStats);
}

/**
 * Main function: Predict goal achievement for single item
 * 
 * For batch operations, use predictGoalWithStats to reuse stats
 */
export async function predictGoal(
  userId: number,
  goalAmount: number
): Promise<GoalPrediction> {
  const stats = await getMonthlyStats(userId);
  const budgetLimits = await getTotalBudgetLimits(userId);
  return predictGoalWithStats(goalAmount, stats, budgetLimits);
}
