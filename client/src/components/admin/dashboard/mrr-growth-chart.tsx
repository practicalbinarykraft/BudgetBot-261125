/**
 * MRR Growth Chart Component
 *
 * Line chart showing MRR growth over 12 months
 * Junior-Friendly: Simple Recharts setup, clear data structure
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderWithHelp } from "@/components/admin/shared/card-header-with-help";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/context";

export function MRRGrowthChart() {
  const { t } = useTranslation();
  const { data: heroMetrics, isLoading } = useQuery({
    queryKey: adminQueryKeys.heroMetrics,
    queryFn: () => adminApi.getHeroMetrics(),
  });

  if (isLoading) {
    return (
      <Card>
        <div className="p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-4" />
        </div>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const trend = heroMetrics?.mrr.trend || [];
  // Transform trend array into chart data format
  const chartData = trend.map((value: number, index: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (trend.length - 1 - index));
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      mrr: value,
    };
  });

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (trend.length === 0) return null;

  return (
    <Card>
      <CardHeaderWithHelp
        title={t('admin.dashboard.mrr_growth')}
        description={t('admin.dashboard.mrr_growth_description')}
        helpKey="admin.dashboard.mrr_growth.help"
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              fontSize={12}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '0.5rem',
              }}
            />
            <Line
              type="monotone"
              dataKey="mrr"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

