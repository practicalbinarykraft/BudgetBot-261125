/**
 * Feature Adoption Chart Component
 *
 * Shows feature usage and adoption metrics
 * Junior-Friendly: Simple BarChart, clear metrics
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { CardHeaderWithHelp } from "@/components/admin/shared/card-header-with-help";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/context";
import { useMemo } from "react";
import type { FeatureAdoption } from "@/lib/admin/mock-data/analytics.mock";

export function FeatureAdoptionChart() {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.featureAdoption,
    queryFn: () => adminApi.getFeatureAdoption(),
  });

  // Prepare chart data with useMemo for safety - MUST be before any conditional returns (React hooks rule)
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      console.error('[FeatureAdoptionChart] Invalid data in useMemo:', { data, type: typeof data, isArray: Array.isArray(data) });
      return [];
    }

    return data.map(feature => ({
      name: feature.feature,
      adoptionRate: feature.adoptionRate,
      retentionLift: feature.retentionLift,
      conversionLift: feature.conversionLift,
    }));
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeaderWithHelp
          title={t('admin.analytics.feature_adoption.title')}
          description={t('admin.analytics.feature_adoption.description')}
          helpKey="admin.analytics.feature_adoption.help"
        />
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeaderWithHelp
          title={t('admin.analytics.feature_adoption.title')}
          description={t('admin.analytics.feature_adoption.description')}
          helpKey="admin.analytics.feature_adoption.help"
        />
        <CardContent>
          <div className="text-center py-12 text-red-600">
            {t('admin.common.error')}: {error?.message || String(error)}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Validate data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <Card>
        <CardHeaderWithHelp
          title={t('admin.analytics.feature_adoption.title')}
          description={t('admin.analytics.feature_adoption.description')}
          helpKey="admin.analytics.feature_adoption.help"
        />
        <CardContent>
          <div className="text-center py-12 text-gray-400">
            {t('admin.common.no_data')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeaderWithHelp
        title={t('admin.analytics.feature_adoption.title')}
        description={t('admin.analytics.feature_adoption.description')}
        helpKey="admin.analytics.feature_adoption.help"
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(1)}%`}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                padding: '0.5rem',
              }}
            />
            <Legend />
            <Bar dataKey="adoptionRate" fill="#3b82f6" name="Adoption Rate" />
            <Bar dataKey="retentionLift" fill="#10b981" name="Retention Lift" />
            <Bar dataKey="conversionLift" fill="#f59e0b" name="Conversion Lift" />
          </BarChart>
        </ResponsiveContainer>

        {/* Feature Details Table */}
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-semibold">Feature Details</h3>
          <div className="space-y-3">
            {Array.isArray(data) && data.map((feature) => (
              <div key={feature.feature} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{feature.feature}</h4>
                  <Badge variant="outline">
                    {feature.adoptionRate.toFixed(1)}% adoption
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Users</div>
                    <div className="font-medium">{feature.totalUsers.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Active (30d)</div>
                    <div className="font-medium">{feature.activeUsers.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Power Users</div>
                    <div className="font-medium">{feature.powerUsers}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Avg Usage</div>
                    <div className="font-medium">{feature.avgUsagePerUser.toFixed(1)}/month</div>
                  </div>
                </div>
                <div className="mt-2 flex gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Retention Lift: </span>
                    <span className="font-medium text-green-600">+{feature.retentionLift.toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Conversion Lift: </span>
                    <span className="font-medium text-blue-600">+{feature.conversionLift.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

