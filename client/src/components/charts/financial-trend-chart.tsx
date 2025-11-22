import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot } from "recharts";
import { useFinancialTrend } from "@/hooks/use-financial-trend";
import { useAssetsHistory } from "@/hooks/use-assets-history";
import { useAssetsForecast } from "@/hooks/use-assets-forecast";
import { WishlistItemWithPrediction } from "@/types/goal-prediction";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, Info } from "lucide-react";
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
import { CapitalWarning } from "@/components/charts/capital-warning";
import { useToast } from "@/hooks/use-toast";
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GraphModeToggle } from "./graph-mode-toggle";

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
  
  const [showForecast, setShowForecast] = useState(true);
  
  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [, setLocation] = useLocation();

  const { 
    data, 
    isLoading, 
    isFetching, 
    error,
    graphMode,
    toggleMode,
    config,
    updateFilter,
  } = useFinancialTrend({
    historyDays,
    forecastDays,
  });

  // Fetch historical assets data
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - historyDays);
  const { data: assetsHistory } = useAssetsHistory({
    startDate: startDate.toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  // Fetch long-term assets forecast (12 months)
  const { data: assetsForecast } = useAssetsForecast({ months: 12 });

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
  }, [error, t, toast]);

  // Destructure trend data and goals
  const rawTrendData = data?.trendData || [];
  const trendGoals = data?.goals || [];
  
  // Merge trend data with historical assets data
  const trendData = rawTrendData.map((point) => {
    if (point.isForecast || !assetsHistory) {
      // For forecast points, keep original assetsNet
      return point;
    }
    
    // For historical points, find matching assets history entry
    const assetsPoint = assetsHistory.find((a) => a.date === point.date);
    
    if (assetsPoint) {
      // Replace assetsNet with historical value
      return {
        ...point,
        assetsNet: assetsPoint.netWorth,
      };
    }
    
    return point;
  });
  
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

  // Prepare long-term assets forecast data (12 months from last point)
  const assetsForecastData = assetsForecast && chartData.length > 0 ? [
    chartData[chartData.length - 1], // Последняя точка
    {
      date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalCapital: assetsForecast.projected,
      isForecast: true,
    }
  ] : [];

  // Calculate fixed Y-axis domain to prevent chart "jumping" when toggling lines
  const yDomain = (() => {
    const allValues: number[] = [];
    chartData.forEach(point => {
      if (point.income !== undefined) allValues.push(point.income);
      if (point.expense !== undefined) allValues.push(point.expense);
      if (point.capital !== undefined) allValues.push(point.capital);
      if (point.assetsNet !== undefined) allValues.push(point.assetsNet);
    });
    if (assetsForecastData.length > 0) {
      assetsForecastData.forEach(point => {
        const totalCapital = (point as any).totalCapital;
        if (totalCapital !== undefined) allValues.push(totalCapital);
      });
    }
    const min = Math.min(...allValues, 0);
    const max = Math.max(...allValues, 0);
    const padding = (max - min) * 0.1;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  })();

  return (
    <Card data-testid="card-financial-trend">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>
            {graphMode === 'lite' ? '📊 Мой капитал' : '📊 Детальный анализ'}
          </CardTitle>
          
          <GraphModeToggle mode={graphMode} onToggle={toggleMode} />
        </div>
        <CardDescription>
          {t("dashboard.financial_trend_subtitle")}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Time Range Controls */}
        <ChartTimeControls
          historyDays={historyDays}
          forecastDays={forecastDays}
          onHistoryChange={setHistoryDays}
          onForecastChange={setForecastDays}
        />

        {/* Assets Forecast Info (12 months) */}
        {assetsForecast && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border" data-testid="assets-forecast-info">
            <TrendingUp className="h-5 w-5 text-primary" />
            <div className="flex-1 space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">
                  {t("dashboard.forecast_12_months")}:
                </span>
                <span className="text-lg font-bold text-primary" data-testid="forecast-projected-value">
                  ${assetsForecast.projected.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className={`text-xs font-medium ${
                  assetsForecast.projected > assetsForecast.current 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  ({assetsForecast.projected > assetsForecast.current ? '+' : ''}
                  {((assetsForecast.projected - assetsForecast.current) / assetsForecast.current * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>
                  {t("dashboard.wallets")}: ${assetsForecast.breakdown.wallets.toFixed(0)}
                </span>
                <span>
                  {t("dashboard.assets")}: ${assetsForecast.breakdown.assets.toFixed(0)}
                </span>
                <span>
                  {t("dashboard.liabilities")}: ${assetsForecast.breakdown.liabilities.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        )}

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
                domain={yDomain}
                tickFormatter={formatCompactCurrency}
                stroke="hsl(var(--muted-foreground))"
              />
              
              <Tooltip key={forecastDays} content={createChartTooltip(chartData, t, config.capitalMode)} />

              {/* "Today" vertical line */}
              {todayDate && (
                <ReferenceLine
                  x={todayDate}
                  stroke={CHART_COLORS.today}
                  strokeDasharray="3 3"
                  label={{ value: t("dashboard.chart_today"), position: "top", fill: CHART_COLORS.today }}
                />
              )}

              {/* Zero baseline horizontal line */}
              <ReferenceLine
                y={0}
                stroke="hsl(var(--foreground))"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />

              {/* Income Line */}
              <Line
                data={chartData}
                dataKey="income"
                stroke={CHART_COLORS.income}
                strokeWidth={2}
                strokeOpacity={config.mode === 'lite' ? 1 : (config.mode === 'pro' && config.showIncome ? 1 : 0)}
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
                strokeOpacity={config.mode === 'lite' ? 1 : (config.mode === 'pro' && config.showExpense ? 1 : 0)}
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
                strokeOpacity={config.mode === 'lite' ? 1 : (config.mode === 'pro' && config.showCapital ? 1 : 0)}
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
                  strokeOpacity={showForecast ? 1 : 0}
                  dot={false}
                  name={t("dashboard.chart_forecast")}
                  connectNulls
                />
              )}

              {/* Assets & Liabilities Line (Orange) */}
              <Line
                data={chartData}
                dataKey="assetsNet"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                strokeDasharray="5 5"
                strokeOpacity={config.mode === 'lite' ? 0 : (config.mode === 'pro' && config.showAssetsLine ? 1 : 0)}
                dot={false}
                name={t("dashboard.chart_assets_liabilities")}
                connectNulls
              />

              {/* Long-term Total Capital Forecast (12 months, dashed purple line) */}
              {assetsForecastData.length > 0 && (
                <Line
                  data={assetsForecastData}
                  dataKey="totalCapital"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  dot={{ r: 6, strokeWidth: 2, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))" }}
                  name={t("dashboard.forecast_12_months")}
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

        {/* Legend (только для PRO режима) */}
        {config.mode === 'pro' && config.showIncome !== undefined && (
          <ChartLegend
            hasForecast={forecastDays > 0 && forecastData.length > 0}
            hasGoals={goals.length > 0}
            showIncome={config.showIncome}
            onIncomeToggle={(val) => updateFilter('showIncome', val)}
            showExpense={config.showExpense}
            onExpenseToggle={(val) => updateFilter('showExpense', val)}
            showCapital={config.showCapital}
            onCapitalToggle={(val) => updateFilter('showCapital', val)}
            showForecast={showForecast}
            onForecastToggle={setShowForecast}
            showAssetsLine={config.showAssetsLine}
            onAssetsLineToggle={(val) => updateFilter('showAssetsLine', val)}
          />
        )}
        
        {/* Capital Warning */}
        <CapitalWarning hasNegativeCapital={hasNegativeCapital} />
      </CardContent>
    </Card>
  );
}
