import { useQuery } from "@tanstack/react-query";

export interface TrendDataPoint {
  date: string;
  income: number;
  expense: number;
  capital: number;
  isToday: boolean;
  isForecast: boolean;
}

interface UseFinancialTrendOptions {
  historyDays?: number;
  forecastDays?: number;
}

/**
 * Hook to fetch financial trend data (historical + forecast)
 * 
 * @param historyDays Number of historical days to fetch (default: 30)
 * @param forecastDays Number of forecast days to generate (default: 365)
 */
export function useFinancialTrend({
  historyDays = 30,
  forecastDays = 365,
}: UseFinancialTrendOptions = {}) {
  return useQuery<TrendDataPoint[]>({
    queryKey: ["/api/analytics/trend", historyDays, forecastDays],
    queryFn: async () => {
      const params = new URLSearchParams({
        historyDays: historyDays.toString(),
        forecastDays: forecastDays.toString(),
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
