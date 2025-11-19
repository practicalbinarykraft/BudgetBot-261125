import { useQuery } from "@tanstack/react-query";

export interface TrendDataPoint {
  date: string;
  income: number;
  expense: number;
  capital: number;
  isToday: boolean;
  isForecast: boolean;
}

export interface GoalMarker {
  id: number;
  name: string;
  amount: string;
  targetDate: string;
  status: string;
  priority: string;
  prediction: {
    monthsToAfford: number | null;
    affordableDate: string | null;
  } | null;
}

export interface TrendWithGoals {
  trendData: TrendDataPoint[];
  goals: GoalMarker[];
}

interface UseFinancialTrendOptions {
  historyDays?: number;
  forecastDays?: number;
  includeRecurring?: boolean;
  includePlannedIncome?: boolean;
  includePlannedExpenses?: boolean;
  includeBudgetLimits?: boolean;
}

/**
 * Hook to fetch financial trend data (historical + forecast) + goal markers
 * 
 * @param historyDays Number of historical days to fetch (default: 30)
 * @param forecastDays Number of forecast days to generate (default: 365)
 * @param includeRecurring Include recurring transactions in forecast (default: true)
 * @param includePlannedIncome Include planned income in forecast (default: true)
 * @param includePlannedExpenses Include planned expenses in forecast (default: true)
 * @param includeBudgetLimits Include budget limits in forecast (default: false)
 */
export function useFinancialTrend({
  historyDays = 30,
  forecastDays = 365,
  includeRecurring = true,
  includePlannedIncome = true,
  includePlannedExpenses = true,
  includeBudgetLimits = false,
}: UseFinancialTrendOptions = {}) {
  return useQuery<TrendWithGoals>({
    queryKey: [
      "/api/analytics/trend", 
      historyDays, 
      forecastDays,
      includeRecurring,
      includePlannedIncome,
      includePlannedExpenses,
      includeBudgetLimits,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        historyDays: historyDays.toString(),
        forecastDays: forecastDays.toString(),
        includeRecurring: includeRecurring.toString(),
        includePlannedIncome: includePlannedIncome.toString(),
        includePlannedExpenses: includePlannedExpenses.toString(),
        includeBudgetLimits: includeBudgetLimits.toString(),
      });
      
      const res = await fetch(`/api/analytics/trend?${params}`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch trend data");
      }
      
      return res.json();
    },
    // Refetch on window focus to get latest data
    refetchOnWindowFocus: true,
    // Keep previous data while fetching new
    placeholderData: (prev) => prev,
  });
}
