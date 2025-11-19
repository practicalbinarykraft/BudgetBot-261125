import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from "recharts";
import { useFinancialTrend } from "@/hooks/use-financial-trend";
import { WishlistItemWithPrediction } from "@/types/goal-prediction";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { GoalTimelineMarker } from "@/components/budget/goal-timeline-marker";
import { GoalTimelineTooltip } from "@/components/budget/goal-timeline-tooltip";
import { useLocation } from "wouter";
import { CHART_COLORS, formatCompactCurrency, formatChartDate } from "@/lib/chart-utils";
import { createChartTooltip } from "@/components/charts/chart-custom-tooltip";
import { normalizeTrendGoals, normalizeWishlistGoals } from "@/lib/normalize-goal-markers";
import { processChartData } from "@/lib/process-chart-data";
import { ChartTimeControls } from "@/components/charts/chart-time-controls";
import { ChartLegend } from "@/components/charts/chart-legend";
import { GoalMarkersLayer } from "@/components/charts/goal-markers-layer";
import { ChartLoadingState, ChartErrorState, ChartEmptyState } from "@/components/charts/chart-loading-states";
import { useTranslation } from "@/i18n";
import { ForecastFiltersCard, type ForecastFilters } from "@/components/charts/forecast-filters";
import { CapitalWarning } from "@/components/charts/capital-warning";
import { useToast } from "@/hooks/use-toast";

/**
 * Financial Trend Chart
 * Shows income, expenses, and capital over time with AI forecast + goal markers
 */
interface FinancialTrendChartProps {
  wishlistPredictions?: WishlistItemWithPrediction[];
}

export function FinancialTrendChart({ wishlistPredictions = [] }: FinancialTrendChartProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [historyDays, setHistoryDays] = useState(30);
  const [forecastDays, setForecastDays] = useState(365);
  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null); // String only (all IDs normalized)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [, setLocation] = useLocation();
  
  // Forecast filters with localStorage persistence
  const [filters, setFilters] = useState<ForecastFilters>(() => {
    const saved = localStorage.getItem('forecastFilters');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          includeRecurringIncome: true,
          includeRecurringExpense: true,
          includePlannedIncome: true,
          includePlannedExpenses: true,
          includeBudgetLimits: false,
        };
      }
    }
    return {
      includeRecurringIncome: true,
      includeRecurringExpense: true,
      includePlannedIncome: true,
      includePlannedExpenses: true,
      includeBudgetLimits: false,
    };
  });
  
  // Save filters to localStorage when they change
  useEffect(() => {
    localStorage.setItem('forecastFilters', JSON.stringify(filters));
  }, [filters]);

  const { data, isLoading, error } = useFinancialTrend({
    historyDays,
    forecastDays,
    includeRecurringIncome: filters.includeRecurringIncome,
    includeRecurringExpense: filters.includeRecurringExpense,
    includePlannedIncome: filters.includePlannedIncome,
    includePlannedExpenses: filters.includePlannedExpenses,
    includeBudgetLimits: filters.includeBudgetLimits,
  });

  // Show error toast when query fails
  useEffect(() => {
    if (error) {
      console.error('[FinancialTrendChart] Query failed:', error);
      toast({
        title: t('common.error'),
        description: error instanceof Error ? error.message : t('dashboard.forecast_error_generic'),
        variant: "destructive",
      });
    }
  }, [error, t]);

  // Destructure trend data and goals
  const trendData = data?.trendData || [];
  const trendGoals = data?.goals || [];
  
  // Merge and normalize goals from both sources
  const goals = [
    ...normalizeTrendGoals(trendGoals),
    ...normalizeWishlistGoals(wishlistPredictions),
  ];

  if (isLoading) return <ChartLoadingState />;
  if (error) return <ChartErrorState error={error as Error} />;
  if (trendData.length === 0) return <ChartEmptyState />;

  // Always process full trendData for proper forecast connection
  const { todayDate, historicalData, forecastData, forecastWithConnection } = 
    processChartData(trendData);

  // Filter chart data for rendering: show only historical when forecastDays = 0
  const chartData = forecastDays > 0 ? trendData : historicalData;
  
  // Check if capital goes negative in forecast
  const hasNegativeCapital = forecastData.some(d => d.capital < 0);

  return (
    <Card data-testid="card-financial-trend">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t("dashboard.financial_trend_title")}
            </CardTitle>
            <CardDescription>
              {t("dashboard.financial_trend_subtitle")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Time Range Controls */}
        <ChartTimeControls
          historyDays={historyDays}
          forecastDays={forecastDays}
          onHistoryChange={setHistoryDays}
          onForecastChange={setForecastDays}
        />

        {/* Chart */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              
              <XAxis
                dataKey="date"
                type="category"
                allowDuplicatedCategory={false}
                tickFormatter={formatChartDate}
                stroke="hsl(var(--muted-foreground))"
              />
              
              <YAxis
                tickFormatter={formatCompactCurrency}
                stroke="hsl(var(--muted-foreground))"
              />
              
              <Tooltip key={forecastDays} content={createChartTooltip(chartData, t)} />

              {/* "Today" vertical line */}
              {todayDate && (
                <ReferenceLine
                  x={todayDate}
                  stroke={CHART_COLORS.today}
                  strokeDasharray="3 3"
                  label={{ value: t("dashboard.chart_today"), position: "top", fill: CHART_COLORS.today }}
                />
              )}

              {/* Income Line */}
              <Line
                data={chartData}
                dataKey="income"
                stroke={CHART_COLORS.income}
                strokeWidth={2}
                dot={false}
                name={t("dashboard.chart_income")}
                connectNulls
              />

              {/* Expense Line */}
              <Line
                data={chartData}
                dataKey="expense"
                stroke={CHART_COLORS.expense}
                strokeWidth={2}
                dot={false}
                name={t("dashboard.chart_expense")}
                connectNulls
              />

              {/* Capital Line (Historical - Solid) */}
              <Line
                data={historicalData}
                dataKey="capital"
                stroke={CHART_COLORS.capital}
                strokeWidth={2}
                dot={false}
                name={t("dashboard.chart_capital")}
                connectNulls
              />

              {/* Capital Line (Forecast - Dashed) */}
              {forecastDays > 0 && forecastData.length > 0 && (
                <Line
                  data={forecastWithConnection}
                  dataKey="capital"
                  stroke={CHART_COLORS.forecast}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name={t("dashboard.chart_forecast")}
                  connectNulls
                />
              )}

              {/* Goal Markers on Timeline */}
              <GoalMarkersLayer
                goals={goals}
                trendData={chartData}
                onGoalHover={(id, x, y) => {
                  setHoveredGoal(id);
                  setTooltipPosition({ x, y });
                }}
                onGoalLeave={() => setHoveredGoal(null)}
                onGoalClick={(status) => 
                  setLocation(status === "wishlist" ? "/wishlist" : "/planned")
                }
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* HTML Tooltip Overlay (Safari compatible) */}
        {hoveredGoal !== null && (
          <>
            {goals.filter(g => g.id === hoveredGoal).map((goal) => (
              <GoalTimelineTooltip 
                key={goal.id}
                goal={goal} 
                position={tooltipPosition}
              />
            ))}
          </>
        )}

        {/* Legend */}
        <ChartLegend
          hasForecast={forecastDays > 0 && forecastData.length > 0}
          hasGoals={goals.length > 0}
        />
        
        {/* Forecast Filters */}
        <ForecastFiltersCard
          filters={filters}
          onChange={setFilters}
          isLoading={isLoading}
        />
        
        {/* Capital Warning */}
        <CapitalWarning hasNegativeCapital={hasNegativeCapital} />
      </CardContent>
    </Card>
  );
}
