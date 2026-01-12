/**
 * Funnel Analysis Chart Component
 *
 * Visualizes user conversion funnel
 * Junior-Friendly: Simple BarChart, clear data structure
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderWithHelp } from "@/components/admin/shared/card-header-with-help";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/context";

interface FunnelStepData {
  step: string;
  users?: number; // из моков
  count?: number; // из API
  conversionRate: number;
  dropoffRate?: number; // из моков
  avgTimeToNext?: number; // из моков
  avgTimeToComplete?: number; // из API
}

export function FunnelChart() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: adminQueryKeys.funnelAnalysis,
    queryFn: () => adminApi.getFunnelAnalysis(),
  });
  // Color gradient from blue (start) to red (end) to show dropoff
  const colors = [
    '#3b82f6', // Blue - start
    '#4f46e5', // Indigo
    '#6366f1', // Indigo lighter
    '#8b5cf6', // Purple
    '#a855f7', // Purple lighter
    '#ec4899', // Pink
    '#ef4444', // Red - end
  ];

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeaderWithHelp
          title={t('admin.analytics.funnel.title')}
          description={t('admin.analytics.funnel.description')}
        />
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Обрабатываем разные форматы данных
  // Моки возвращают массив напрямую
  // API возвращает объект с полем steps
  let steps: FunnelStepData[] = [];
  if (Array.isArray(data)) {
    // Моки: массив напрямую
    steps = data;
  } else if (data && typeof data === 'object' && 'steps' in data && Array.isArray(data.steps)) {
    // API: объект с полем steps
    // Преобразуем count в users для единообразия
    steps = data.steps.map((step: any) => ({
      step: step.step,
      users: step.count || step.users || 0,
      conversionRate: step.conversionRate || 0,
      dropoffRate: step.dropoffRate || 0,
      avgTimeToNext: step.avgTimeToComplete ? step.avgTimeToComplete * 24 : step.avgTimeToNext || 0,
    }));
  } else {
    console.error('Invalid funnel data format:', data);
    return (
      <Card>
        <CardHeaderWithHelp
          title={t('admin.analytics.funnel.title')}
          description={t('admin.analytics.funnel.description')}
        />
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Неверный формат данных</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (steps.length === 0) {
    return (
      <Card>
        <CardHeaderWithHelp
          title={t('admin.analytics.funnel.title')}
          description={t('admin.analytics.funnel.description')}
        />
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Нет данных для отображения</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeaderWithHelp
        title={t('admin.analytics.funnel.title')}
        description={t('admin.analytics.funnel.description')}
        helpKey="admin.analytics.funnel.help"
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={steps} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={formatNumber}
            />
            <YAxis
              type="category"
              dataKey="step"
              stroke="#6b7280"
              fontSize={12}
              width={150}
            />
            <Tooltip
              formatter={(value: number, name: string, props: any) => {
                if (name === 'users') {
                  return [
                    `${value.toLocaleString()} users`,
                    `Conversion: ${props.payload.conversionRate}%`,
                    props.payload.dropoffRate !== undefined ? `Dropoff: ${props.payload.dropoffRate}%` : null,
                  ].filter(Boolean);
                }
                return value;
              }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '0.5rem',
              }}
            />
            <Bar dataKey="users" radius={[0, 4, 4, 0]}>
              {steps.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Conversion Rates Table */}
        <div className="mt-6 space-y-2">
          <h3 className="text-sm font-semibold">Conversion Rates</h3>
          <div className="space-y-1">
            {steps.map((step, index) => {
              if (index === 0) return null;
              const prevStep = steps[index - 1];
              return (
                <div key={step.step} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {prevStep.step} → {step.step}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{step.conversionRate.toFixed(1)}%</span>
                    <span className="text-gray-400">
                      {step.avgTimeToNext && step.avgTimeToNext > 0 ? `${step.avgTimeToNext.toFixed(1)}h avg` : '-'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

