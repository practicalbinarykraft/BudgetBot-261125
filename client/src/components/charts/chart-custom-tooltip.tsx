import { CHART_COLORS, formatFullCurrency, formatChartDate } from "@/lib/chart-utils";

interface TrendDataPoint {
  date: string;
  income?: number | null;
  expense?: number | null;
  capital?: number | null;
  isForecast?: boolean;
}

interface ChartCustomTooltipProps {
  trendData: TrendDataPoint[];
}

export function createChartTooltip(trendData: TrendDataPoint[]) {
  return function ChartTooltip({ active, label }: any) {
    if (!active || !label) {
      return null;
    }

    const dataPoint = trendData.find(d => d.date === label);
    if (!dataPoint) return null;
    
    return (
      <div
        style={{
          backgroundColor: "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "8px",
          padding: "12px",
        }}
      >
        <p className="font-medium mb-2">{formatChartDate(label)}</p>
        
        {dataPoint.income != null && (
          <p style={{ color: CHART_COLORS.income, margin: "4px 0" }}>
            Income: {formatFullCurrency(dataPoint.income)}
          </p>
        )}
        
        {dataPoint.expense != null && (
          <p style={{ color: CHART_COLORS.expense, margin: "4px 0" }}>
            Expense: {formatFullCurrency(dataPoint.expense)}
          </p>
        )}
        
        {dataPoint.capital != null && (
          <p style={{ color: CHART_COLORS.capital, margin: "4px 0" }}>
            {dataPoint.isForecast ? "Forecast" : "Capital"}: {formatFullCurrency(dataPoint.capital)}
          </p>
        )}
      </div>
    );
  };
}
