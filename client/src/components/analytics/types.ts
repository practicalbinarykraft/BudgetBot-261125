/**
 * Analytics Types
 *
 * Type definitions for advanced analytics components.
 * Shared across all analytics cards.
 */

export interface SpendingForecast {
  forecast: number;
  confidence: "low" | "medium" | "high";
  trend: "increasing" | "decreasing" | "stable";
  historicalAverage: number;
  monthlyData: Array<{
    month: string;
    amount: number;
  }>;
}

export interface BudgetRecommendation {
  categoryId: number | null;
  categoryName: string;
  monthlyAverage: number;
  currentBudget: number;
  recommendedBudget: number;
  status: "good" | "too_low" | "too_high" | "no_budget";
  message: string;
}

export interface SpendingTrends {
  monthlyTrend: Array<{
    month: string;
    total: number;
    transactions: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    total: number;
    percentage: number;
  }>;
  insights: {
    averageMonthlySpending: number;
    highestMonth: number;
    lowestMonth: number;
    volatility: number;
  };
}

export interface FinancialHealthScore {
  score: number;
  rating: "excellent" | "good" | "fair" | "poor";
  breakdown: {
    budgetAdherence: number;
    savingsRate: number;
    spendingRatio: number;
  };
  metrics: {
    monthlyIncome: number;
    monthlyExpense: number;
    monthlySavings: number;
  };
}

// Chart colors constant
export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

// Utility functions for styling
export function getRatingColor(rating: string): string {
  switch (rating) {
    case "excellent":
      return "text-green-600 dark:text-green-400";
    case "good":
      return "text-blue-600 dark:text-blue-400";
    case "fair":
      return "text-yellow-600 dark:text-yellow-400";
    case "poor":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "good":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "too_low":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "too_high":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "no_budget":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}
