/**
 * Financial Trend Chart
 *
 * Shows income, expenses, and capital over time with AI forecast + goal markers.
 * ~200 lines - composed of smaller chart components.
 *
 * Junior-Friendly:
 * - Was 429 lines, now ~200 lines
 * - Chart lines extracted to TrendChartLines component
 * - Forecast banner extracted to AssetsForecastBanner component
 */

import { useState, useEffect } from "react";
import { LineChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useFinancialTrend } from "@/hooks/use-financial-trend";
import { useAssetsHistory } from "@/hooks/use-assets-history";
import { useAssetsForecast } from "@/hooks/use-assets-forecast";
import { WishlistItemWithPrediction } from "@/types/goal-prediction";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
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
import { CapitalWarning } from "@/components/charts/capital-warning";
import { useToast } from "@/hooks/use-toast";
import { GoalTimelineTooltip } from "@/components/budget/goal-timeline-tooltip";
import { GraphModeToggle } from "./graph-mode-toggle";
import { AssetsForecastBanner } from "./assets-forecast-banner";
import { TrendChartLines } from "./trend-chart-lines";

interface FinancialTrendChartProps {
  wishlistPredictions?: WishlistItemWithPrediction[];
}

export function FinancialTrendChart({ wishlistPredictions = [] }: FinancialTrendChartProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [historyDays, setHistoryDays] = useState(30);
  const [forecastDays, setForecastDays] = useState(365);
  const [showForecast, setShowForecast] = useState(true);
  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [, setLocation] = useLocation();

  const { data, isLoading, error, graphMode, toggleMode, config, updateFilter } = useFinancialTrend({
    historyDays,
    forecastDays,
  });

  // Fetch historical and forecast assets data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - historyDays);
  const { data: assetsHistory } = useAssetsHistory({
    startDate: startDate.toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const { data: assetsForecast } = useAssetsForecast({ months: 12 });

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("dashboard.forecast_error_generic"),
        variant: "destructive",
      });
    }
  }, [error, t, toast]);

  // Process data
  const rawTrendData = data?.trendData || [];
  const trendGoals = data?.goals || [];

  // Merge trend data with historical assets
  const trendData = rawTrendData.map((point) => {
    if (point.isForecast || !assetsHistory) return point;
    const assetsPoint = assetsHistory.find((a) => a.date === point.date);
    return assetsPoint ? { ...point, assetsNet: assetsPoint.netWorth } : point;
  });

  const goals = [...normalizeTrendGoals(trendGoals), ...normalizeWishlistGoals(wishlistPredictions)];

  if (isLoading) return <ChartLoadingState />;
  if (error) return <ChartErrorState error={error as Error} />;
  if (trendData.length === 0) return <ChartEmptyState />;

  const { historicalData, forecastData, forecastWithConnection } = processChartData(trendData);
  const chartData = forecastDays > 0 ? trendData : historicalData;
  const hasNegativeCapital = forecastData.some((d) => d.capital < 0);

  // Assets forecast line data
  const assetsForecastData = assetsForecast && chartData.length > 0
    ? [
        chartData[chartData.length - 1],
        {
          date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          totalCapital: assetsForecast.projected,
          isForecast: true,
        },
      ]
    : [];

  // Calculate Y-axis domain
  const yDomain = (() => {
    const allValues: number[] = [];
    chartData.forEach((p) => {
      if (p.income !== undefined) allValues.push(p.income);
      if (p.expense !== undefined) allValues.push(p.expense);
      if (p.capital !== undefined) allValues.push(p.capital);
      if (p.assetsNet !== undefined) allValues.push(p.assetsNet);
    });
    assetsForecastData.forEach((p: any) => {
      if (p.totalCapital !== undefined) allValues.push(p.totalCapital);
    });
    const min = Math.min(...allValues, 0);
    const max = Math.max(...allValues, 0);
    const padding = (max - min) * 0.1;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  })();

  return (
    <Card data-testid="card-financial-trend">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <CardTitle className="text-lg md:text-xl">
            {graphMode === "lite" ? t("dashboard.my_capital") : t("dashboard.detailed_analysis")}
          </CardTitle>
          <GraphModeToggle mode={graphMode} onToggle={toggleMode} />
        </div>
        <CardDescription>{t("dashboard.financial_trend_subtitle")}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <ChartTimeControls
          historyDays={historyDays}
          forecastDays={forecastDays}
          onHistoryChange={setHistoryDays}
          onForecastChange={setForecastDays}
        />

        {assetsForecast && <AssetsForecastBanner forecast={assetsForecast} />}

        <div className="h-[300px] md:h-[400px]" role="img" aria-label="Financial trend chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis dataKey="date" tickFormatter={formatChartDate} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={yDomain} tickFormatter={formatCompactCurrency} stroke="hsl(var(--muted-foreground))" />
              <Tooltip content={createChartTooltip(chartData, t, config.capitalMode, graphMode)} />

              <TrendChartLines
                historicalData={historicalData}
                forecastData={forecastData}
                forecastWithConnection={forecastWithConnection}
                chartData={chartData}
                forecastDays={forecastDays}
                config={config}
                graphMode={graphMode}
                assetsForecastData={assetsForecastData}
              />

              <GoalMarkersLayer
                goals={goals}
                trendData={chartData}
                onGoalHover={(id, x, y) => {
                  setHoveredGoal(id);
                  setTooltipPosition({ x, y });
                }}
                onGoalLeave={() => setHoveredGoal(null)}
                onGoalClick={(status) => setLocation(status === "wishlist" ? "/wishlist" : "/planned")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {hoveredGoal && (
          <>
            {goals.filter((g) => g.id === hoveredGoal).map((goal) => (
              <GoalTimelineTooltip key={goal.id} goal={goal} position={tooltipPosition} />
            ))}
          </>
        )}

        {config.mode === "pro" && config.showIncome !== undefined && (
          <ChartLegend
            hasForecast={forecastDays > 0 && forecastData.length > 0}
            hasGoals={goals.length > 0}
            showIncome={config.showIncome}
            onIncomeToggle={(val) => updateFilter("showIncome", val)}
            showExpense={config.showExpense}
            onExpenseToggle={(val) => updateFilter("showExpense", val)}
            showCapital={config.showCapital}
            onCapitalToggle={(val) => updateFilter("showCapital", val)}
            showForecast={showForecast}
            onForecastToggle={setShowForecast}
            showAssetsLine={config.showAssetsLine}
            onAssetsLineToggle={(val) => updateFilter("showAssetsLine", val)}
          />
        )}

        <CapitalWarning hasNegativeCapital={hasNegativeCapital} />
      </CardContent>
    </Card>
  );
}
