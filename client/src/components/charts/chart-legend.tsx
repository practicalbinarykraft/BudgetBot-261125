import { TrendingUp } from "lucide-react";
import { CHART_COLORS } from "@/lib/chart-utils";
import { useTranslation } from "@/i18n";

interface ChartLegendProps {
  hasForecast: boolean;
  hasGoals: boolean;
}

export function ChartLegend({ hasForecast, hasGoals }: ChartLegendProps) {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5" style={{ backgroundColor: CHART_COLORS.income }} />
        <span>{t("dashboard.chart_income")}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5" style={{ backgroundColor: CHART_COLORS.expense }} />
        <span>{t("dashboard.chart_expense")}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-8 h-0.5" style={{ backgroundColor: CHART_COLORS.capital }} />
        <span>{t("dashboard.chart_capital_actual")}</span>
      </div>
      {hasForecast && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 border-t-2 border-dashed" style={{ borderColor: CHART_COLORS.forecast }} />
          <span>{t("dashboard.chart_capital_forecast")}</span>
        </div>
      )}
      {hasGoals && (
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span>{t("dashboard.chart_goal_markers")}</span>
        </div>
      )}
    </div>
  );
}
