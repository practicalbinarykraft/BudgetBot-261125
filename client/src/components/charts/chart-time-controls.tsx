import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  return (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">History:</label>
        <Select 
          value={historyDays.toString()} 
          onValueChange={(v) => onHistoryChange(parseInt(v))}
        >
          <SelectTrigger className="w-32" data-testid="select-history-days">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="60">60 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
            <SelectItem value="365">1 year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Forecast:</label>
        <Select 
          value={forecastDays.toString()} 
          onValueChange={(v) => onForecastChange(parseInt(v))}
        >
          <SelectTrigger className="w-32" data-testid="select-forecast-days">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">None</SelectItem>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
            <SelectItem value="365">1 year</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
