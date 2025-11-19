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
  useAI?: boolean;
  includeRecurringIncome?: boolean;
  includeRecurringExpense?: boolean;
  includePlannedIncome?: boolean;
  includePlannedExpenses?: boolean;
  includeBudgetLimits?: boolean;
}

/**
 * Hook to fetch financial trend data (historical + forecast) + goal markers
 * 
 * @param historyDays Number of historical days to fetch (default: 30)
 * @param forecastDays Number of forecast days to generate (default: 365)
 * @param useAI Use AI forecast (opt-in, default: false)
 * @param includeRecurringIncome Include recurring income in forecast (default: true)
 * @param includeRecurringExpense Include recurring expenses in forecast (default: true)
 * @param includePlannedIncome Include planned income in forecast (default: true)
 * @param includePlannedExpenses Include planned expenses in forecast (default: true)
 * @param includeBudgetLimits Include budget limits in forecast (default: false)
 */
export function useFinancialTrend({
  historyDays = 30,
  forecastDays = 365,
  useAI = false,
  includeRecurringIncome = true,
  includeRecurringExpense = true,
  includePlannedIncome = true,
  includePlannedExpenses = true,
  includeBudgetLimits = false,
}: UseFinancialTrendOptions = {}) {
  const queryKey = [
    "/api/analytics/trend", 
    historyDays, 
    forecastDays,
    useAI,
    includeRecurringIncome,
    includeRecurringExpense,
    includePlannedIncome,
    includePlannedExpenses,
    includeBudgetLimits,
  ];

  console.log('[useFinancialTrend] Query key:', queryKey);

  return useQuery<TrendWithGoals>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        historyDays: historyDays.toString(),
        forecastDays: forecastDays.toString(),
        useAI: useAI.toString(),
        includeRecurringIncome: includeRecurringIncome.toString(),
        includeRecurringExpense: includeRecurringExpense.toString(),
        includePlannedIncome: includePlannedIncome.toString(),
        includePlannedExpenses: includePlannedExpenses.toString(),
        includeBudgetLimits: includeBudgetLimits.toString(),
      });
      
      console.log('[useFinancialTrend] Fetching with params:', params.toString());
      
      const res = await fetch(`/api/analytics/trend?${params}`, {
        cache: 'no-store',
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch trend data");
      }
      
      return res.json();
    },
    // Keep previous data while fetching new
    placeholderData: (prev) => prev,
    // Consider data immediately stale to allow refetch on param change
    staleTime: 0,
    // Force refetch when query key changes
    refetchOnMount: 'always',
  });
}
