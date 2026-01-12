/**
 * Admin Analytics Page
 *
 * Analytics and insights dashboard
 * Junior-Friendly: Uses TanStack Query, clear structure
 */

import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelChart } from "@/components/admin/analytics/funnel-chart";
import { FeatureAdoptionChart } from "@/components/admin/analytics/feature-adoption-chart";
import { UserSegments } from "@/components/admin/analytics/user-segments";
import { CohortRetentionHeatmap } from "@/components/admin/dashboard/cohort-retention-heatmap";
import { useTranslation } from "@/i18n/context";

export default function AdminAnalyticsPage() {
  const { t } = useTranslation();
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.analytics.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('admin.analytics.description')}
          </p>
        </div>

        {/* Analytics Charts and Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FunnelChart />
          <CohortRetentionHeatmap /> {/* Reusing from dashboard */}
          <FeatureAdoptionChart />
          <UserSegments />
        </div>
      </div>
    </AdminLayout>
  );
}

