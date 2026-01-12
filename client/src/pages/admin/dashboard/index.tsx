/**
 * Admin Dashboard Page
 *
 * Main dashboard with key metrics and charts
 * Junior-Friendly: Uses TanStack Query for data fetching
 */

import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/admin/dashboard/metric-card";
import { MRRGrowthChart } from "@/components/admin/dashboard/mrr-growth-chart";
import { MRRWaterfallChart } from "@/components/admin/dashboard/mrr-waterfall-chart";
import { CohortRetentionHeatmap } from "@/components/admin/dashboard/cohort-retention-heatmap";
import { useTranslation } from "@/i18n/context";
import { Lock } from "lucide-react";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { data: heroMetrics, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.heroMetrics,
    queryFn: () => adminApi.getHeroMetrics(),
  });

  const { data: revenueMetrics, isLoading: isLoadingRevenue } = useQuery({
    queryKey: adminQueryKeys.revenueMetrics,
    queryFn: () => adminApi.getRevenueMetrics(),
  });

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{t('admin.dashboard.failed_to_load')}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('admin.dashboard.description')}
          </p>
        </div>

        {/* Hero Metrics Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : heroMetrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title={t('admin.dashboard.mrr')}
              value={heroMetrics.mrr.current}
              format="currency"
              change={heroMetrics.mrr.change}
              trend={heroMetrics.mrr.trend}
              helpKey="admin.dashboard.mrr.help"
            />
            <MetricCard
              title={t('admin.dashboard.total_users')}
              value={heroMetrics.totalUsers.current}
              format="number"
              change={heroMetrics.totalUsers.change}
              description={`${heroMetrics.totalUsers.activeToday} ${t('admin.dashboard.active_today')}`}
              helpKey="admin.dashboard.total_users.help"
            />
            <MetricCard
              title={t('admin.dashboard.ltv')}
              value={heroMetrics.ltv}
              format="currency"
              description={t('admin.dashboard.ltv_description')}
              helpKey="admin.dashboard.ltv.help"
            />
            {heroMetrics.cac !== null ? (
              <MetricCard
                title={t('admin.dashboard.cac')}
                value={heroMetrics.cac}
                format="currency"
                description={`LTV:CAC = ${heroMetrics.ltvCacRatio?.toFixed(2) || '0.00'}:1`}
                helpKey="admin.dashboard.cac.help"
              />
            ) : (
              <Card className="opacity-60">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {t('admin.dashboard.cac')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 mb-3">
                    {t('admin.dashboard.cac_unavailable')}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="w-full bg-gray-100 text-gray-400 cursor-not-allowed"
                  >
                    <Lock className="h-3 w-3 mr-1" />
                    {t('admin.dashboard.connect')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MRR Growth Chart */}
          <MRRGrowthChart />

          {/* Cohort Retention Heatmap */}
          <CohortRetentionHeatmap />
        </div>

        {/* MRR Waterfall Chart */}
        <MRRWaterfallChart />
      </div>
    </AdminLayout>
  );
}

