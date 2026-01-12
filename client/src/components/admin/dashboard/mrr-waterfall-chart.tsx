/**
 * MRR Waterfall Chart Component
 *
 * Bar chart showing MRR breakdown: New, Expansion, Contraction, Churn
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

export function MRRWaterfallChart() {
  const { t } = useTranslation();
  const { data: revenueMetrics, isLoading } = useQuery({
    queryKey: adminQueryKeys.revenueMetrics,
    queryFn: () => adminApi.getRevenueMetrics(),
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

  if (!revenueMetrics) return null;

  const { newMRR, expansionMRR, contractionMRR, churnedMRR } = revenueMetrics.mrr;
  const data = [
    { name: "New MRR", value: newMRR, color: "#10b981" }, // Green
    { name: "Expansion", value: expansionMRR, color: "#3b82f6" }, // Blue
    { name: "Contraction", value: contractionMRR, color: "#f59e0b" }, // Amber
    { name: "Churned", value: churnedMRR, color: "#ef4444" }, // Red
  ];

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Card>
      <CardHeaderWithHelp
        title={t('admin.dashboard.mrr_breakdown')}
        description={t('admin.dashboard.mrr_breakdown_description')}
        helpKey="admin.dashboard.mrr_breakdown.help"
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              type="number"
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#6b7280"
              fontSize={12}
              width={100}
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
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

