import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

export type DateFilterValue = "week" | "month" | "year" | "all";

interface DateFilterProps {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
}

export function DateFilter({ value, onChange }: DateFilterProps) {
  const { t } = useTranslation();
  
  const filters: { value: DateFilterValue; label: string }[] = [
    { value: "week", label: t("dashboard.filter.week") },
    { value: "month", label: t("dashboard.filter.month") },
    { value: "year", label: t("dashboard.filter.year") },
    { value: "all", label: t("dashboard.filter.all_time") },
  ];

  return (
    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={value === filter.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(filter.value)}
          data-testid={`filter-${filter.value}`}
          className="toggle-elevate toggle-elevated text-xs sm:text-sm px-2 sm:px-3"
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
}

// Helper to format date as YYYY-MM-DD in local timezone
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDateRange(filter: DateFilterValue): { from: string; to: string } | null {
  const now = new Date();
  const today = formatLocalDate(now);
  
  if (filter === "all") {
    return null; // No filtering
  }
  
  if (filter === "week") {
    // Last 7 days including today
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 6);
    return {
      from: formatLocalDate(startOfWeek),
      to: today,
    };
  }
  
  if (filter === "month") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      from: formatLocalDate(startOfMonth),
      to: today,
    };
  }
  
  if (filter === "year") {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return {
      from: formatLocalDate(startOfYear),
      to: today,
    };
  }
  
  return null;
}
