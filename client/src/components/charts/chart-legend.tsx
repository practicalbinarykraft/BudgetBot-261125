import { TrendingUp } from "lucide-react";
import { CHART_COLORS } from "@/lib/chart-utils";
import { useTranslation } from "@/i18n";
import { Checkbox } from "@/components/ui/checkbox";

interface ChartLegendProps {
  hasForecast: boolean;
  hasGoals: boolean;
  showIncome?: boolean;
  onIncomeToggle?: (show: boolean) => void;
  showExpense?: boolean;
  onExpenseToggle?: (show: boolean) => void;
  showCapital?: boolean;
  onCapitalToggle?: (show: boolean) => void;
  showForecast?: boolean;
  onForecastToggle?: (show: boolean) => void;
  showAssetsLine?: boolean;
  onAssetsLineToggle?: (show: boolean) => void;
}

export function ChartLegend({ 
  hasForecast, 
  hasGoals, 
  showIncome,
  onIncomeToggle,
  showExpense,
  onExpenseToggle,
  showCapital,
  onCapitalToggle,
  showForecast,
  onForecastToggle,
  showAssetsLine, 
  onAssetsLineToggle 
}: ChartLegendProps) {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={showIncome ?? true}
          onCheckedChange={(checked) => onIncomeToggle?.(Boolean(checked))}
          data-testid="checkbox-income-toggle"
        />
        <div className="w-8 h-0.5" style={{ backgroundColor: CHART_COLORS.income }} />
        <span>{t("dashboard.chart_income")}</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={showExpense ?? true}
          onCheckedChange={(checked) => onExpenseToggle?.(Boolean(checked))}
          data-testid="checkbox-expense-toggle"
        />
        <div className="w-8 h-0.5" style={{ backgroundColor: CHART_COLORS.expense }} />
        <span>{t("dashboard.chart_expense")}</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <Checkbox
          checked={showCapital ?? true}
          onCheckedChange={(checked) => onCapitalToggle?.(Boolean(checked))}
          data-testid="checkbox-capital-toggle"
        />
        <div className="w-8 h-0.5" style={{ backgroundColor: CHART_COLORS.capital }} />
        <span>{t("dashboard.chart_capital_actual")}</span>
      </label>
      {hasForecast && (
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={showForecast ?? true}
            onCheckedChange={(checked) => onForecastToggle?.(Boolean(checked))}
            data-testid="checkbox-forecast-toggle"
          />
          <div className="w-8 h-0.5 border-t-2 border-dashed" style={{ borderColor: CHART_COLORS.forecast }} />
          <span>{t("dashboard.chart_capital_forecast")}</span>
        </label>
      )}
      {showAssetsLine !== undefined && onAssetsLineToggle && (
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={showAssetsLine}
            onCheckedChange={(checked) => onAssetsLineToggle(Boolean(checked))}
            data-testid="checkbox-assets-net-toggle"
          />
          <div className="w-8 h-0.5 border-t-2 border-dashed" style={{ borderColor: "hsl(var(--chart-4))" }} />
          <span>{t("dashboard.chart_assets_liabilities")}</span>
        </label>
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
