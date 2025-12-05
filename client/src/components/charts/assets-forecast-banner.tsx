/**
 * Assets Forecast Banner
 *
 * Displays 12-month assets forecast summary.
 * ~50 lines - focused on forecast display.
 */

import { TrendingUp } from "lucide-react";
import { useTranslation } from "@/i18n";

interface AssetsForecastData {
  current: number;
  projected: number;
  breakdown: {
    wallets: number;
    assets: number;
    liabilities: number;
  };
}

interface AssetsForecastBannerProps {
  forecast: AssetsForecastData;
}

export function AssetsForecastBanner({ forecast }: AssetsForecastBannerProps) {
  const { t } = useTranslation();
  const isPositive = forecast.projected > forecast.current;
  const changePercent = ((forecast.projected - forecast.current) / forecast.current * 100).toFixed(1);

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/50 rounded-lg border"
      data-testid="assets-forecast-info"
      role="region"
      aria-label="12-month forecast summary"
    >
      <TrendingUp className="h-5 w-5 text-primary flex-shrink-0" aria-hidden="true" />
      <div className="flex-1 space-y-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-medium">
            {t("dashboard.forecast_12_months")}:
          </span>
          <span className="text-lg font-bold text-primary" data-testid="forecast-projected-value">
            ${forecast.projected.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
          <span className={`text-xs font-medium ${
            isPositive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}>
            ({isPositive ? "+" : ""}{changePercent}%)
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{t("dashboard.wallets")}: ${forecast.breakdown.wallets.toFixed(0)}</span>
          <span>{t("dashboard.assets")}: ${forecast.breakdown.assets.toFixed(0)}</span>
          <span>{t("dashboard.liabilities")}: ${forecast.breakdown.liabilities.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}
