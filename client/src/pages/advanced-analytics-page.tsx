/**
 * Advanced Analytics Page
 *
 * AI-powered financial insights, forecasts, and recommendations.
 * ~80 lines - composed of smaller card components.
 *
 * Junior-Friendly:
 * - Was 464 lines, now ~80 lines
 * - Each card is a separate component (<150 lines)
 * - Clear separation of concerns
 */

import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import {
  HealthScoreCard,
  ForecastCard,
  RecommendationsCard,
  TrendsCard,
  SpendingForecast,
  BudgetRecommendation,
  SpendingTrends,
  FinancialHealthScore,
} from "@/components/analytics";

export default function AdvancedAnalyticsPage() {
  // Fetch data from all endpoints
  const { data: forecast, isLoading: forecastLoading } = useQuery<SpendingForecast>({
    queryKey: ["/api/analytics/advanced/forecast"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/advanced/forecast");
      return res.json();
    },
  });

  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<BudgetRecommendation[]>({
    queryKey: ["/api/analytics/advanced/recommendations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/advanced/recommendations");
      return res.json();
    },
  });

  const { data: trends, isLoading: trendsLoading } = useQuery<SpendingTrends>({
    queryKey: ["/api/analytics/advanced/trends"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/advanced/trends");
      return res.json();
    },
  });

  const { data: healthScore, isLoading: healthScoreLoading } = useQuery<FinancialHealthScore>({
    queryKey: ["/api/analytics/advanced/health-score"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/advanced/health-score");
      return res.json();
    },
  });

  const isLoading = forecastLoading || recommendationsLoading || trendsLoading || healthScoreLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link href="/app/dashboard">
          <Button variant="ghost" size="icon" data-testid="button-back" aria-label="Back to dashboard">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-page-title">
            Advanced Analytics
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            AI-powered insights, forecasts, and recommendations
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading analytics data">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <main className="space-y-6">
          {healthScore && <HealthScoreCard healthScore={healthScore} />}
          {forecast && <ForecastCard forecast={forecast} />}
          {recommendations && <RecommendationsCard recommendations={recommendations} />}
          {trends && <TrendsCard trends={trends} />}
        </main>
      )}
    </div>
  );
}
