import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client";
import type {
  AdvancedHealthScore,
  SpendingForecast,
  BudgetRecommendation,
  SpendingTrends,
} from "../types";

export function useAdvancedAnalytics() {
  const healthQuery = useQuery({
    queryKey: ["analytics-health-score"],
    queryFn: () =>
      api.get<AdvancedHealthScore>("/api/analytics/advanced/health-score"),
  });

  const forecastQuery = useQuery({
    queryKey: ["analytics-forecast"],
    queryFn: () =>
      api.get<SpendingForecast>("/api/analytics/advanced/forecast"),
  });

  const recsQuery = useQuery({
    queryKey: ["analytics-recommendations"],
    queryFn: () =>
      api.get<BudgetRecommendation[]>(
        "/api/analytics/advanced/recommendations"
      ),
  });

  const trendsQuery = useQuery({
    queryKey: ["analytics-trends"],
    queryFn: () => api.get<SpendingTrends>("/api/analytics/advanced/trends"),
  });

  const isLoading =
    healthQuery.isLoading ||
    forecastQuery.isLoading ||
    recsQuery.isLoading ||
    trendsQuery.isLoading;

  return {
    isLoading,
    health: healthQuery.data,
    forecast: forecastQuery.data,
    recommendations: recsQuery.data,
    trends: trendsQuery.data,
  };
}
