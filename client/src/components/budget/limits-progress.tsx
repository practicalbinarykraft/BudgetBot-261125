import { useQuery } from "@tanstack/react-query";
import { LimitProgressBar } from "./limit-progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import type { LimitProgress } from "@/types/limit-progress";
import { useTranslation } from "@/i18n/context";

export function LimitsProgress() {
  const { t } = useTranslation();
  const { data: limits, isLoading, error } = useQuery<LimitProgress[]>({
    queryKey: ['/api/limits'],
  });

  // Загрузка
  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="limits-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-card border border-border rounded-md">
            <Skeleton className="h-6 w-32 mb-3" />
            <Skeleton className="h-2 w-full mb-3" />
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Ошибка
  if (error) {
    return (
      <div
        className="p-4 bg-card border border-border rounded-md text-center"
        data-testid="limits-error"
      >
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {t("budgets.failed_load_limits")}
        </p>
      </div>
    );
  }

  // Нет лимитов
  if (!limits || limits.length === 0) {
    return (
      <div
        className="p-6 bg-card border border-border rounded-md text-center"
        data-testid="limits-empty"
      >
        <p className="text-muted-foreground">{t("budgets.no_limits_set")}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("budgets.create_to_track")}
        </p>
      </div>
    );
  }

  // Отображаем список лимитов
  return (
    <div className="space-y-4" data-testid="limits-list">
      {limits.map((limit) => (
        <LimitProgressBar
          key={limit.budgetId}
          limit={limit}
        />
      ))}
    </div>
  );
}
