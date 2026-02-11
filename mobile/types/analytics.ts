export interface FinancialHealthScore {
  score: number;
  status: string;
  metrics: {
    budgetAdherence: number;
    cashflowBalance: number;
    expenseStability: number;
  };
}

export interface PriceRecommendation {
  itemName: string;
  normalizedName: string;
  currentMerchant: string;
  currentPrice: number;
  bestPrice: number;
  bestMerchant: string;
  savings: number;
  savingsPercent: number;
}

export interface PriceRecommendationsResponse {
  recommendations: PriceRecommendation[];
  totalPotentialSavings: number;
  averageSavingsPercent: number;
  aiInsights?: string | null;
}

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

export interface AdvancedHealthScore {
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

export interface TrendDataPoint {
  date: string;
  income: number;
  expense: number;
  capital: number;
  assetsNet: number;
  isToday: boolean;
  isForecast: boolean;
}

export interface TrendResponse {
  trendData: TrendDataPoint[];
  goals: Array<{
    id: number;
    name: string;
    amount: string;
    targetDate: string;
    status: string;
    priority: string;
  }>;
}
