import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getProgressColorZone, type LimitProgress } from "@/types/limit-progress";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useTranslation } from "@/i18n/context";
import { useTranslateCategory } from "@/lib/category-translations";

interface LimitProgressBarProps {
  limit: LimitProgress;
}

export function LimitProgressBar({ limit }: LimitProgressBarProps) {
  const { t } = useTranslation();
  const translateCategory = useTranslateCategory();
  const { categoryName, categoryIcon, spent, limitAmount, percentage, period } = limit;

  const zone = getProgressColorZone(percentage);
  const limitNum = parseFloat(limitAmount);
  const remaining = limitNum - spent;

  // Цветовая схема для каждой зоны
  const zoneStyles = {
    safe: {
      progressBg: 'bg-[hsl(var(--chart-2))]', // Зелёный
      textColor: 'text-[hsl(var(--chart-2))]',
      badgeVariant: 'default' as const,
      icon: TrendingUp,
    },
    warning: {
      progressBg: 'bg-[hsl(var(--chart-3))]', // Жёлтый
      textColor: 'text-[hsl(var(--chart-3))]',
      badgeVariant: 'secondary' as const,
      icon: AlertTriangle,
    },
    danger: {
      progressBg: 'bg-[hsl(var(--destructive))]', // Красный
      textColor: 'text-[hsl(var(--destructive))]',
      badgeVariant: 'destructive' as const,
      icon: AlertTriangle,
    },
    exceeded: {
      progressBg: 'bg-[hsl(var(--destructive)_/_0.8)]', // Тёмно-красный
      textColor: 'text-[hsl(var(--destructive))]',
      badgeVariant: 'destructive' as const,
      icon: TrendingDown,
    },
  };

  const style = zoneStyles[zone];
  const Icon = style.icon;
  const cappedPercentage = Math.min(percentage, 100);

  const getZoneLabel = () => {
    switch (zone) {
      case 'safe': return t("budgets.zone_safe");
      case 'warning': return t("budgets.zone_warning");
      case 'danger': return t("budgets.zone_danger");
      case 'exceeded': return t("budgets.zone_exceeded");
      default: return "";
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return t("budgets.period_week");
      case 'month': return t("budgets.period_month");
      case 'year': return t("budgets.period_year");
      default: return period;
    }
  };

  return (
    <div
      className="p-4 bg-card border border-border rounded-md"
      data-testid={`limit-progress-${limit.budgetId}`}
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {categoryIcon && (
            <span className="text-lg" data-testid="icon-category">
              {categoryIcon}
            </span>
          )}
          <h3 className="font-medium" data-testid="text-category-name">
            {translateCategory(categoryName)}
          </h3>
        </div>
        <Badge variant={style.badgeVariant} data-testid="badge-status">
          <Icon className="h-3 w-3 mr-1" />
          {getZoneLabel()}
        </Badge>
      </div>

      {/* Прогресс-бар */}
      <div className="mb-3">
        <Progress
          value={cappedPercentage}
          className="h-2"
          data-testid="progress-bar"
          indicatorClassName={style.progressBg}
        />
      </div>

      {/* Статистика */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-muted-foreground">{t("budgets.spent")} </span>
            <span className="font-mono font-medium" data-testid="text-spent">
              ${spent.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("budgets.limit_label")} </span>
            <span className="font-mono font-medium" data-testid="text-limit">
              ${limitNum.toFixed(2)}
            </span>
          </div>
        </div>
        <div className={style.textColor}>
          {remaining >= 0 ? (
            <span className="font-medium" data-testid="text-remaining">
              ${remaining.toFixed(2)} {t("budgets.left")}
            </span>
          ) : (
            <span className="font-medium" data-testid="text-overspent">
              ${Math.abs(remaining).toFixed(2)} {t("budgets.over")}
            </span>
          )}
        </div>
      </div>

      {/* Период */}
      <div className="mt-2 text-xs text-muted-foreground" data-testid="text-period">
        {t("budgets.period_label")} {getPeriodLabel()} ({percentage.toFixed(1)}%)
      </div>
    </div>
  );
}
