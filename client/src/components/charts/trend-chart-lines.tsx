/**
 * Trend Chart Lines Component
 *
 * Renders all chart lines for financial trend visualization.
 * ~140 lines - focused on line rendering logic.
 */

import { Line, ReferenceLine } from "recharts";
import { CHART_COLORS } from "@/lib/chart-utils";
import { useTranslation } from "@/i18n";

interface TrendDataPoint {
  date: string;
  income?: number;
  expense?: number;
  capital?: number;
  assetsNet?: number;
  isForecast?: boolean;
}

interface ChartConfig {
  mode: "lite" | "pro";
  showIncome?: boolean;
  showExpense?: boolean;
  showCapital?: boolean;
  showAssetsLine?: boolean;
  capitalMode: string;
}

interface TrendChartLinesProps {
  historicalData: TrendDataPoint[];
  forecastData: TrendDataPoint[];
  forecastWithConnection: TrendDataPoint[];
  chartData: TrendDataPoint[];
  forecastDays: number;
  config: ChartConfig;
  graphMode: "lite" | "pro";
  assetsForecastData?: Array<{ date: string; totalCapital?: number }>;
}

export function TrendChartLines({
  historicalData,
  forecastData,
  forecastWithConnection,
  chartData,
  forecastDays,
  config,
  graphMode,
  assetsForecastData = [],
}: TrendChartLinesProps) {
  const { t } = useTranslation();
  const showForecastLines = forecastDays > 0 && forecastData.length > 0;
  const getOpacity = (lineType: "income" | "expense" | "capital") => {
    if (config.mode === "lite") return 1;
    if (config.mode === "pro") {
      if (lineType === "income" && config.showIncome) return 1;
      if (lineType === "expense" && config.showExpense) return 1;
      if (lineType === "capital" && config.showCapital) return 1;
    }
    return 0;
  };

  return (
    <>
      {/* "Today" vertical line */}
      <ReferenceLine
        x={new Date().toISOString().split("T")[0]}
        stroke="#94a3b8"
        strokeWidth={2}
        strokeDasharray="3 3"
        label={{
          value: "Сегодня",
          position: "top",
          fill: "#64748b",
          fontSize: 12,
          fontWeight: 600,
        }}
      />

      {/* Zero baseline */}
      <ReferenceLine
        y={0}
        stroke="hsl(var(--foreground))"
        strokeDasharray="3 3"
        strokeOpacity={0.5}
      />

      {/* Income Lines */}
      <Line
        data={historicalData}
        dataKey="income"
        stroke={CHART_COLORS.income}
        strokeWidth={2}
        strokeOpacity={getOpacity("income")}
        dot={false}
        name={t("dashboard.chart_income")}
        connectNulls
      />
      {showForecastLines && (
        <Line
          data={forecastWithConnection}
          dataKey="income"
          stroke={CHART_COLORS.income}
          strokeWidth={2}
          strokeDasharray="5 5"
          opacity={0.7}
          dot={false}
          name="Доходы (прогноз)"
          connectNulls
        />
      )}

      {/* Expense Lines */}
      <Line
        data={historicalData}
        dataKey="expense"
        stroke={CHART_COLORS.expense}
        strokeWidth={2}
        strokeOpacity={getOpacity("expense")}
        dot={false}
        name={t("dashboard.chart_expense")}
        connectNulls
      />
      {showForecastLines && (
        <Line
          data={forecastWithConnection}
          dataKey="expense"
          stroke={CHART_COLORS.expense}
          strokeWidth={2}
          strokeDasharray="5 5"
          opacity={0.7}
          dot={false}
          name="Расходы (прогноз)"
          connectNulls
        />
      )}

      {/* Capital Lines */}
      <Line
        data={historicalData}
        dataKey="capital"
        stroke={CHART_COLORS.capital}
        strokeWidth={2}
        strokeOpacity={getOpacity("capital")}
        dot={false}
        name={t("dashboard.chart_capital")}
        connectNulls
      />
      {showForecastLines && (
        <Line
          data={forecastWithConnection}
          dataKey="capital"
          stroke={CHART_COLORS.capital}
          strokeWidth={2}
          strokeDasharray="5 5"
          opacity={0.7}
          dot={false}
          name="Капитал (прогноз)"
          connectNulls
        />
      )}

      {/* Assets Line - PRO only */}
      {graphMode === "pro" && config.mode === "pro" && config.showAssetsLine && (
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

      {/* 12-month Total Capital Forecast */}
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
    </>
  );
}
