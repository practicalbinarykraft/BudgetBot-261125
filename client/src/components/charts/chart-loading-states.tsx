import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n";
import { TrendingUp, RefreshCw, AlertCircle, BarChart3 } from "lucide-react";

/**
 * Animated skeleton for chart loading
 * Shows visual feedback that chart is being built
 */
export function ChartLoadingState() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl">
            {t('dashboard.financial_forecast')}
          </CardTitle>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time controls skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Chart area with animated skeleton */}
        <div className="relative h-[300px] sm:h-[350px] md:h-[400px] bg-muted/30 rounded-lg overflow-hidden">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/50 to-transparent animate-shimmer" />

          {/* Chart placeholder lines */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 gap-1">
            {/* Simulated chart bars/lines */}
            <div className="flex items-end gap-1 h-full">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-muted/40 rounded-t animate-pulse"
                  style={{
                    height: `${30 + Math.random() * 50}%`,
                    animationDelay: `${i * 50}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Center loading indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 bg-background/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <div className="relative">
                <BarChart3 className="h-10 w-10 text-primary" />
                <RefreshCw className="h-5 w-5 text-primary absolute -bottom-1 -right-1 animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">{t('dashboard.chart_loading') || 'Строим график...'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('dashboard.chart_loading_hint') || 'Анализируем ваши финансы'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Overlay shown when chart is refetching/updating
 */
export function ChartRefetchingOverlay() {
  const { t } = useTranslation();

  return (
    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-lg">
      <div className="flex items-center gap-3 bg-background/90 rounded-lg px-4 py-3 shadow-lg border">
        <RefreshCw className="h-5 w-5 text-primary animate-spin" />
        <span className="text-sm font-medium">
          {t('dashboard.chart_updating') || 'Обновляем график...'}
        </span>
      </div>
    </div>
  );
}

export function ChartErrorState({ error }: { error: Error }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          {t('dashboard.financial_forecast')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="font-medium text-destructive">
            {t('dashboard.chart_error') || 'Не удалось загрузить график'}
          </p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {error.message}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChartEmptyState() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          {t('dashboard.financial_forecast')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <TrendingUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-medium">
            {t('dashboard.chart_no_data') || 'Нет данных для отображения'}
          </p>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {t('dashboard.chart_no_data_hint') || 'Добавьте транзакции чтобы увидеть финансовый тренд'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
