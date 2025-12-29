import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/i18n";

interface ChartTimeControlsProps {
  historyDays: number;
  forecastDays: number;
  onHistoryChange: (days: number) => void;
  onForecastChange: (days: number) => void;
}

export function ChartTimeControls({
  historyDays,
  forecastDays,
  onHistoryChange,
  onForecastChange,
}: ChartTimeControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
      <div className="flex items-center gap-2">
        <label className="text-xs sm:text-sm font-medium whitespace-nowrap">{t("dashboard.history")}</label>
        <Select
          value={historyDays.toString()}
          onValueChange={(v) => onHistoryChange(parseInt(v))}
        >
          <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm" data-testid="select-history-days">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">{t("dashboard.days_7")}</SelectItem>
            <SelectItem value="30">{t("dashboard.days_30")}</SelectItem>
            <SelectItem value="60">{t("dashboard.days_60")}</SelectItem>
            <SelectItem value="90">{t("dashboard.days_90")}</SelectItem>
            <SelectItem value="365">{t("dashboard.year_1")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs sm:text-sm font-medium whitespace-nowrap">{t("dashboard.forecast_label")}</label>
        <Select
          value={forecastDays.toString()}
          onValueChange={(v) => onForecastChange(parseInt(v))}
        >
          <SelectTrigger className="w-full sm:w-32 text-xs sm:text-sm" data-testid="select-forecast-days">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t("dashboard.none")}</SelectItem>
            <SelectItem value="7">{t("dashboard.days_7")}</SelectItem>
            <SelectItem value="30">{t("dashboard.days_30")}</SelectItem>
            <SelectItem value="90">{t("dashboard.days_90")}</SelectItem>
            <SelectItem value="365">{t("dashboard.year_1")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
