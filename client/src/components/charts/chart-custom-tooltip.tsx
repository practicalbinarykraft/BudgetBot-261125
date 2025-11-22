import { CHART_COLORS, formatFullCurrency, formatChartDate } from "@/lib/chart-utils";

interface TrendDataPoint {
  date: string;
  income?: number | null;
  expense?: number | null;
  capital?: number | null;
  assetsNet?: number | null;
  isForecast?: boolean;
}

type TranslateFn = (key: string) => string;
type CapitalMode = 'cash' | 'networth';

export function createChartTooltip(
  trendData: TrendDataPoint[], 
  t: TranslateFn, 
  capitalMode: CapitalMode = 'networth'
) {
  return function ChartTooltip({ active, label }: any) {
    if (!active || !label) {
      return null;
    }

    const dataPoint = trendData.find(d => d.date === label);
    if (!dataPoint) return null;
    
    const showNetWorth = capitalMode === 'networth';
    const assetsNet = dataPoint.assetsNet ?? 0;
    
    // Backend returns correct capital based on mode:
    // - networth: capital = wallets + income - expenses + assetsNet
    // - cash: capital = wallets + income - expenses
    const capitalFull = dataPoint.capital ?? 0;
    const capitalCash = showNetWorth ? capitalFull - assetsNet : capitalFull;
    
    return (
      <div
        className="bg-card border-2 border-border rounded-lg shadow-xl max-w-sm"
        style={{ padding: "16px" }}
      >
        <p className="font-bold text-lg mb-3 pb-2 border-b border-border">
          {formatChartDate(label)}
        </p>
        
        {dataPoint.capital != null && (
          <div className="mb-3">
            <p className="text-sm font-semibold text-muted-foreground mb-1">
              {showNetWorth ? t("dashboard.tooltip_full_capital") : t("dashboard.tooltip_cash_capital")}
            </p>
            <p className="text-2xl font-bold" style={{ color: CHART_COLORS.capital }}>
              {formatFullCurrency(showNetWorth ? capitalFull : capitalCash)}
            </p>
          </div>
        )}
        
        {showNetWorth && dataPoint.capital != null && assetsNet !== 0 && (
          <div className="mb-3 p-2 bg-muted/50 rounded text-sm space-y-1">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              {t("dashboard.tooltip_breakdown")}:
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("dashboard.tooltip_cash")}:</span>
              <span className="font-medium">{formatFullCurrency(capitalCash)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("dashboard.tooltip_assets_minus_liabilities")}:</span>
              <span 
                className="font-medium" 
                style={{ color: assetsNet >= 0 ? CHART_COLORS.income : CHART_COLORS.expense }}
              >
                {assetsNet >= 0 ? '+' : ''}{formatFullCurrency(assetsNet)}
              </span>
            </div>
          </div>
        )}
        
        {(dataPoint.income != null || dataPoint.expense != null) && (
          <div className="space-y-1 text-sm">
            {dataPoint.income != null && (
              <div className="flex justify-between">
                <span style={{ color: CHART_COLORS.income }}>{t("dashboard.chart_income")}:</span>
                <span className="font-medium">+{formatFullCurrency(dataPoint.income)}</span>
              </div>
            )}
            {dataPoint.expense != null && (
              <div className="flex justify-between">
                <span style={{ color: CHART_COLORS.expense }}>{t("dashboard.chart_expense")}:</span>
                <span className="font-medium">-{formatFullCurrency(dataPoint.expense)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
}
