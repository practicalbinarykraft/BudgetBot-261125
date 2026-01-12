/**
 * Cohort Retention Heatmap Component
 *
 * Custom heatmap showing user retention by signup cohort
 * Junior-Friendly: Simple grid, color-coded cells
 */

import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderWithHelp } from "@/components/admin/shared/card-header-with-help";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/context";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { Skeleton } from "@/components/ui/skeleton";

export interface CohortData {
  cohortMonth: string; // '2025-01'
  usersCount: number;
  retention: {
    month0: number;
    month1: number;
    month2: number;
    month3: number;
    month6: number;
    month12: number;
  };
}

interface CohortRetentionHeatmapProps {
  cohorts?: CohortData[];
}

// Generate mock cohort data if not provided
function generateMockCohorts(): CohortData[] {
  const cohorts: CohortData[] = [];
  const now = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const cohortMonth = date.toISOString().slice(0, 7); // 'YYYY-MM'
    
    const baseRetention = 100 - (i * 3); // Decreasing retention over time
    const usersCount = Math.floor(Math.random() * 100) + 50;
    
    cohorts.push({
      cohortMonth,
      usersCount,
      retention: {
        month0: 100,
        month1: Math.max(70, baseRetention - 10),
        month2: Math.max(60, baseRetention - 20),
        month3: Math.max(50, baseRetention - 30),
        month6: Math.max(40, baseRetention - 40),
        month12: Math.max(30, baseRetention - 50),
      },
    });
  }
  
  return cohorts;
}

export function CohortRetentionHeatmap({ cohorts }: CohortRetentionHeatmapProps) {
  const { t } = useTranslation();
  
  // Если cohorts переданы как prop, используем их (для тестирования)
  // Иначе загружаем из API
  const { data: apiCohorts, isLoading } = useQuery({
    queryKey: adminQueryKeys.cohortRetention,
    queryFn: () => adminApi.getCohortRetention(),
    enabled: !cohorts, // Загружаем только если cohorts не переданы
  });

  // Используем prop cohorts, если они есть, иначе API данные, иначе моки
  const data = cohorts || apiCohorts || generateMockCohorts();

  if (isLoading && !cohorts) {
    return (
      <Card>
        <div className="p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
        </div>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }
  const months = ['month0', 'month1', 'month2', 'month3', 'month6', 'month12'];
  const monthLabels = [
    t('admin.cohort_retention.label.month0'),
    t('admin.cohort_retention.label.month1'),
    t('admin.cohort_retention.label.month2'),
    t('admin.cohort_retention.label.month3'),
    t('admin.cohort_retention.label.month6'),
    t('admin.cohort_retention.label.month12'),
  ];

  // Get color intensity based on retention percentage
  const getColorClass = (retention: number) => {
    if (retention >= 80) return 'bg-green-600';
    if (retention >= 60) return 'bg-green-500';
    if (retention >= 40) return 'bg-yellow-500';
    if (retention >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeaderWithHelp
        title={t('admin.dashboard.cohort_retention')}
        description={t('admin.dashboard.cohort_retention_description')}
        helpKey="admin.dashboard.cohort_retention.help"
      />
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header */}
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-xs font-semibold text-gray-600">{t('admin.cohort_retention.label.cohort')}</div>
              {monthLabels.map((label, index) => (
                <div key={months[index]} className="text-xs font-semibold text-gray-600 text-center">
                  {label}
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {data.map((cohort: CohortData) => (
                <div key={cohort.cohortMonth} className="grid grid-cols-8 gap-2">
                  {/* Cohort label */}
                  <div className="text-xs text-gray-700 flex items-center">
                    {new Date(cohort.cohortMonth + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    <span className="ml-1 text-gray-400">({cohort.usersCount})</span>
                  </div>

                  {/* Retention cells */}
                  {months.map((month) => {
                    const retention = cohort.retention[month as keyof typeof cohort.retention];
                    return (
                      <div
                        key={month}
                        className={cn(
                          "h-10 rounded flex items-center justify-center text-white text-xs font-medium",
                          getColorClass(retention)
                        )}
                        title={`${retention}% retention`}
                      >
                        {retention}%
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs">
              <span className="text-gray-600">{t('admin.cohort_retention.legend.title')}</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-red-500 rounded" />
                <span>{t('admin.cohort_retention.legend.range_0_20')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-orange-500 rounded" />
                <span>{t('admin.cohort_retention.legend.range_20_40')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-yellow-500 rounded" />
                <span>{t('admin.cohort_retention.legend.range_40_60')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-500 rounded" />
                <span>{t('admin.cohort_retention.legend.range_60_80')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-600 rounded" />
                <span>{t('admin.cohort_retention.legend.range_80_plus')}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

