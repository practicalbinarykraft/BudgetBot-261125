/**
 * Financial Trend Chart
 * Shows income, expenses, and capital over time with AI forecast + goal markers
 * With mobile adaptation for responsive display
 */

import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useFinancialTrend } from "@/hooks/use-financial-trend";
import { useAssetsHistory } from "@/hooks/use-assets-history";
import { useAssetsForecast } from "@/hooks/use-assets-forecast";
import { WishlistItemWithPrediction } from "@/types/goal-prediction";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, RefreshCw } from "lucide-react";
import { GoalTimelineTooltip } from "@/components/budget/goal-timeline-tooltip";
import { useLocation } from "wouter";
import { CHART_COLORS, formatCompactCurrency, formatChartDate } from "@/lib/chart-utils";
import { createChartTooltip } from "@/components/charts/chart-custom-tooltip";
import { normalizeTrendGoals, normalizeWishlistGoals } from "@/lib/normalize-goal-markers";
import { processChartData } from "@/lib/process-chart-data";
import { ChartTimeControls } from "@/components/charts/chart-time-controls";
import { ChartLegend } from "@/components/charts/chart-legend";
import { GoalMarkersLayer } from "@/components/charts/goal-markers-layer";
import { ChartLoadingState, ChartErrorState, ChartEmptyState, ChartRefetchingOverlay } from "@/components/charts/chart-loading-states";
import { useTranslation } from "@/i18n";
import { CapitalWarning } from "@/components/charts/capital-warning";
import { useToast } from "@/hooks/use-toast";
import { GraphModeToggle } from "./graph-mode-toggle";
import { useQuery } from "@tanstack/react-query";
import { Settings as SettingsType } from "@shared/schema";

interface FinancialTrendChartProps {
  wishlistPredictions?: WishlistItemWithPrediction[];
}

export function FinancialTrendChart({ wishlistPredictions = [] }: FinancialTrendChartProps) {
  const isMobile = useIsMobile();
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [historyDays, setHistoryDays] = useState(30);
  const [forecastDays, setForecastDays] = useState(365);

  const [hoveredGoal, setHoveredGoal] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [, setLocation] = useLocation();

  const { data: settings } = useQuery<SettingsType>({
    queryKey: ["/api/settings"],
  });

  const {
    data,
    isLoading,
    isFetching,
    error,
    graphMode,
    toggleMode,
    config,
    updateFilter,
    applyChanges,
    hasUnappliedChanges,
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

  // Show error toast when query fails (but not for 401 - user will be redirected)
  useEffect(() => {
    if (error) {
      console.error('[FinancialTrendChart] Query failed:', error);
      // Не показываем тост для 401 ошибок - пользователь будет перенаправлен на логин
      if (error instanceof Error && error.message.includes('401')) {
        console.log('[FinancialTrendChart] 401 error, skipping toast (user will be redirected)');
        return;
      }
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
      return point;
    }

    const assetsPoint = assetsHistory.find((a) => a.date === point.date);

    if (assetsPoint) {
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
  const { historicalData, forecastData, forecastWithConnection } =
    processChartData(trendData, false);

  // Filter chart data for rendering: show only historical when forecastDays = 0
  const chartData = forecastDays > 0 ? trendData : historicalData;

  // Check if capital goes negative in forecast
  const hasNegativeCapital = forecastData.some(d => d.capital < 0);

  // Calculate forecast summary from chart data (synchronized with graph)
  const forecastSummary = (() => {
    if (forecastData.length === 0) return null;

    // Current capital: today's point or last historical point
    const todayStr = new Date().toISOString().split('T')[0];
    const todayPoint = historicalData.find(d => d.date === todayStr);
    const currentCapital = todayPoint?.capital ?? historicalData[historicalData.length - 1]?.capital ?? 0;

    // Projected capital: last point of forecast
    const projectedCapital = forecastData[forecastData.length - 1]?.capital ?? currentCapital;

    // Calculate percentage change
    const percentChange = currentCapital !== 0
      ? ((projectedCapital - currentCapital) / Math.abs(currentCapital)) * 100
      : 0;

    return {
      current: currentCapital,
      projected: projectedCapital,
      percentChange,
    };
  })();

  // Type guard for PRO config
  const isProMode = config.mode === 'pro';
  const proConfig = isProMode ? config : null;

  // Prepare long-term assets forecast data (12 months from last point)
  const assetsForecastData = assetsForecast && chartData.length > 0 ? [
    chartData[chartData.length - 1],
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
          <CardTitle className="text-lg md:text-xl">
            {t('dashboard.financial_forecast')}
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

        {/* Forecast Summary (synchronized with chart) */}
        {forecastSummary && forecastDays > 0 && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border" data-testid="forecast-summary-info">
            <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-sm font-medium">
                  {t("dashboard.forecast_12_months")}:
                </span>
                <span className="text-lg font-bold text-primary" data-testid="forecast-projected-value">
                  ${forecastSummary.projected.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
                <span className={`text-xs font-medium ${
                  forecastSummary.percentChange >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  ({forecastSummary.percentChange >= 0 ? '+' : ''}
                  {forecastSummary.percentChange.toFixed(1)}%)
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {t("dashboard.capital")}: ${forecastSummary.current.toLocaleString('en-US', { maximumFractionDigits: 0 })} → ${forecastSummary.projected.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        )}

        {/* Chart with mobile adaptation */}
        <div
          className="relative h-[300px] sm:h-[350px] md:h-[400px] w-full"
          role="img"
          aria-label="Financial trend chart"
        >
          {/* Show overlay when refetching */}
          {isFetching && !isLoading && <ChartRefetchingOverlay />}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={isMobile
                ? { top: 5, right: 15, left: 5, bottom: 40 }
                : { top: 5, right: 20, left: 10, bottom: 5 }
              }
            >
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />

              <XAxis
                dataKey="date"
                type="category"
                allowDuplicatedCategory={false}
                tickFormatter={(date) => formatChartDate(date, language)}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: isMobile ? 8 : 12 }}
                interval={isMobile ? Math.ceil(chartData.length / 5) : Math.ceil(chartData.length / 10)}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 50 : undefined}
                dx={isMobile ? -5 : 0}
              />

              <YAxis
                domain={yDomain}
                tickFormatter={formatCompactCurrency}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: isMobile ? 9 : 12 }}
                width={isMobile ? 35 : undefined}
              />

              <Tooltip 
                key={forecastDays} 
                content={createChartTooltip(chartData, t, config.capitalMode, graphMode)}
                position={(props: any) => {
                  // Размещаем tooltip снизу графика, под точкой
                  if (!props.coordinate || !props.viewBox) {
                    return { x: 0, y: 0 };
                  }
                  const chartHeight = props.viewBox.height;
                  const bottomOffset = 60; // Отступ снизу для tooltip
                  return {
                    x: props.coordinate.x,
                    y: chartHeight - bottomOffset
                  };
                }}
                allowEscapeViewBox={{ x: false, y: true }}
                wrapperStyle={{ zIndex: 10, pointerEvents: 'none' }}
              />

              {/* "Today" vertical line */}
              <ReferenceLine
                x={new Date().toISOString().split('T')[0]}
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: t('common.today') || 'Сегодня',
                  position: 'top',
                  fill: '#64748b',
                  fontSize: isMobile ? 10 : 12,
                  fontWeight: 600
                }}
              />

              {/* Zero baseline horizontal line */}
              <ReferenceLine
                y={0}
                stroke="hsl(var(--foreground))"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />

              {/* Income Line (Historical - Solid) */}
              <Line
                data={historicalData}
                dataKey="income"
                stroke={CHART_COLORS.income}
                strokeWidth={2}
                strokeOpacity={isProMode ? (proConfig?.showIncome ? 1 : 0) : 1}
                dot={false}
                name={t("dashboard.chart_income")}
                connectNulls
              />

              {/* Income Line (Forecast - Dashed) */}
              {forecastDays > 0 && forecastData.length > 0 && (
                <Line
                  data={forecastWithConnection}
                  dataKey="income"
                  stroke={CHART_COLORS.income}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  strokeOpacity={isProMode ? (proConfig?.showIncome ? 0.7 : 0) : 0.7}
                  dot={false}
                  name="Доходы (прогноз)"
                  connectNulls
                />
              )}

              {/* Expense Line (Historical - Solid) */}
              <Line
                data={historicalData}
                dataKey="expense"
                stroke={CHART_COLORS.expense}
                strokeWidth={2}
                strokeOpacity={isProMode ? (proConfig?.showExpense ? 1 : 0) : 1}
                dot={false}
                name={t("dashboard.chart_expense")}
                connectNulls
              />

              {/* Expense Line (Forecast - Dashed) */}
              {forecastDays > 0 && forecastData.length > 0 && (
                <Line
                  data={forecastWithConnection}
                  dataKey="expense"
                  stroke={CHART_COLORS.expense}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  strokeOpacity={isProMode ? (proConfig?.showExpense ? 0.7 : 0) : 0.7}
                  dot={false}
                  name="Расходы (прогноз)"
                  connectNulls
                />
              )}

              {/* Capital Line (Historical - Solid) */}
              <Line
                data={historicalData}
                dataKey="capital"
                stroke={CHART_COLORS.capital}
                strokeWidth={2}
                strokeOpacity={isProMode ? (proConfig?.showCapital ? 1 : 0) : 1}
                dot={false}
                name={t("dashboard.chart_capital")}
                connectNulls
              />

              {/* Capital Line (Forecast - Dashed) */}
              {forecastDays > 0 && forecastData.length > 0 && (
                <Line
                  data={forecastWithConnection}
                  dataKey="capital"
                  stroke={CHART_COLORS.capital}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  strokeOpacity={isProMode ? (proConfig?.showCapital ? 0.7 : 0) : 0.7}
                  dot={false}
                  name="Капитал (прогноз)"
                  connectNulls
                />
              )}

              {/* Assets Line - PRO only */}
              {isProMode && proConfig?.showAssetsLine && (
                <Line
                  type="monotone"
                  data={chartData}
                  dataKey="assetsNet"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Имущество - Долги"
                  connectNulls
                />
              )}

              {/* Long-term Total Capital Forecast (12 months) */}
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

        {/* Legend (for PRO mode) */}
        {isProMode && proConfig && (
          <ChartLegend
            hasForecast={forecastDays > 0 && forecastData.length > 0}
            hasGoals={goals.length > 0}
            showIncome={proConfig.showIncome}
            onIncomeToggle={(val) => updateFilter('showIncome', val)}
            showExpense={proConfig.showExpense}
            onExpenseToggle={(val) => updateFilter('showExpense', val)}
            showCapital={proConfig.showCapital}
            onCapitalToggle={(val) => updateFilter('showCapital', val)}
            showAssetsLine={proConfig.showAssetsLine}
            onAssetsLineToggle={(val) => updateFilter('showAssetsLine', val)}
          />
        )}

        {/* PRO MODE SETTINGS */}
        {isProMode && proConfig && (
          <div className="space-y-4 mt-6">

            {/* Update Chart Button - shows when there are unapplied changes */}
            {hasUnappliedChanges && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/30">
                <span className="text-sm text-foreground">
                  {t('dashboard.chart_settings_changed')}
                </span>
                <Button
                  onClick={applyChanges}
                  disabled={isFetching}
                  className="gap-2"
                  data-testid="btn-update-chart"
                >
                  {isFetching ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {t('dashboard.update_chart')}
                </Button>
              </div>
            )}

            {/* Capital Mode Section */}
            <div className="p-4 bg-card rounded-lg border space-y-3" data-testid="section-capital-mode">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                Режим расчёта капитала
              </h3>

              <div className="space-y-2">
                <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-muted/50 rounded-lg transition-colors" data-testid="radio-networth">
                  <input
                    type="radio"
                    name="capitalMode"
                    value="networth"
                    checked={proConfig.capitalMode === 'networth'}
                    onChange={(e) => updateFilter('capitalMode', e.target.value)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      Полный капитал
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Деньги + Имущество - Долги
                    </div>
                    {proConfig.capitalMode === 'networth' && (
                      <div className="text-xs text-primary font-medium mt-1">
                        Учитывает все активы и обязательства
                      </div>
                    )}
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-muted/50 rounded-lg transition-colors" data-testid="radio-cash">
                  <input
                    type="radio"
                    name="capitalMode"
                    value="cash"
                    checked={proConfig.capitalMode === 'cash'}
                    onChange={(e) => updateFilter('capitalMode', e.target.value)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      Только деньги
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Без недвижимости и кредитов
                    </div>
                    {proConfig.capitalMode === 'cash' && (
                      <div className="text-xs text-primary font-medium mt-1">
                        Показывает только кошельки и счета
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Forecast Type Section (if AI key exists) */}
            {settings?.anthropicApiKey && (
              <div className="p-4 bg-card rounded-lg border space-y-3" data-testid="section-forecast-type">
                <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                  Тип прогноза
                </h3>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-muted/50 rounded-lg transition-colors" data-testid="radio-ai-forecast">
                    <input
                      type="radio"
                      name="forecastType"
                      value="ai"
                      checked={proConfig.forecastType === 'ai'}
                      onChange={(e) => updateFilter('forecastType', e.target.value)}
                      className="w-4 h-4 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        AI прогноз (умный)
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Учитывает паттерны ваших трат и сезонность
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer p-3 hover:bg-muted/50 rounded-lg transition-colors" data-testid="radio-linear-forecast">
                    <input
                      type="radio"
                      name="forecastType"
                      value="linear"
                      checked={proConfig.forecastType === 'linear'}
                      onChange={(e) => updateFilter('forecastType', e.target.value)}
                      className="w-4 h-4 mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        Линейный прогноз (простой)
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        На основе средних значений за последние месяцы
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Forecast Filters Section */}
            <div className="p-4 bg-card rounded-lg border space-y-3" data-testid="section-forecast-filters">
              <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
                Включить в прогноз
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors" data-testid="checkbox-recurring-income">
                  <input
                    type="checkbox"
                    checked={proConfig.includeRecurringIncome}
                    onChange={(e) => updateFilter('includeRecurringIncome', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Зарплата и повторяющиеся доходы</span>
                </label>

                <label className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors" data-testid="checkbox-asset-income">
                  <input
                    type="checkbox"
                    checked={proConfig.includeAssetIncome}
                    onChange={(e) => updateFilter('includeAssetIncome', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Доход от активов (аренда, дивиденды)</span>
                </label>

                <label className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors" data-testid="checkbox-recurring-expense">
                  <input
                    type="checkbox"
                    checked={proConfig.includeRecurringExpense}
                    onChange={(e) => updateFilter('includeRecurringExpense', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Обычные расходы</span>
                </label>

                <label className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors" data-testid="checkbox-liability-expense">
                  <input
                    type="checkbox"
                    checked={proConfig.includeLiabilityExpense}
                    onChange={(e) => updateFilter('includeLiabilityExpense', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Платежи по кредитам</span>
                </label>

                <label className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors" data-testid="checkbox-planned-expense">
                  <input
                    type="checkbox"
                    checked={proConfig.includePlannedExpense}
                    onChange={(e) => updateFilter('includePlannedExpense', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Запланированные покупки</span>
                </label>

                <label className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors" data-testid="checkbox-budget-limits">
                  <input
                    type="checkbox"
                    checked={proConfig.includeBudgetLimits}
                    onChange={(e) => updateFilter('includeBudgetLimits', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Бюджетные лимиты</span>
                </label>

                <label className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer transition-colors" data-testid="checkbox-asset-value-change">
                  <input
                    type="checkbox"
                    checked={proConfig.includeAssetValueChange}
                    onChange={(e) => updateFilter('includeAssetValueChange', e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Рост стоимости недвижимости</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Capital Warning */}
        <CapitalWarning hasNegativeCapital={hasNegativeCapital} />
      </CardContent>
    </Card>
  );
}
