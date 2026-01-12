/**
 * Admin System Monitoring Page
 *
 * System health and monitoring dashboard
 * Junior-Friendly: Simple cards, clear status indicators
 */

import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { useTranslation } from "@/i18n/context";

// Type definitions for system health data
interface ExternalServiceStatus {
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
}

interface BackgroundJob {
  status: 'success' | 'failed';
  lastRun: string;
  sent?: number;
  deleted?: number;
}

export default function AdminSystemMonitoringPage() {
  const { t } = useTranslation();
  const { data: systemHealth, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.systemHealth,
    queryFn: () => adminApi.getSystemHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'down':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      healthy: 'default',
      degraded: 'secondary',
      down: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('admin.system.title')}</h1>
          <p className="text-gray-600 mt-1">
            {t('admin.system.description')}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">
            {t('admin.common.error')}
          </div>
        ) : systemHealth ? (
          <>
            {/* API Health */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.system.api.title')}</CardTitle>
                <CardDescription>{t('admin.system.api.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">{t('admin.system.metrics.uptime')}</div>
                    <div className="text-2xl font-bold">{systemHealth.api.uptimePercent.toFixed(2)}%</div>
                    <div className="text-xs text-gray-500">
                      {Math.floor(systemHealth.api.uptime / 86400)}d {Math.floor((systemHealth.api.uptime % 86400) / 3600)}h
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t('admin.system.metrics.avg_response_time')}</div>
                    <div className="text-2xl font-bold">{systemHealth.api.avgResponseTime}ms</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t('admin.system.metrics.error_rate')}</div>
                    <div className="text-2xl font-bold">{systemHealth.api.errorRate}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t('admin.system.metrics.requests_24h')}</div>
                    <div className="text-2xl font-bold">{systemHealth.api.requests24h.toLocaleString()}</div>
                  </div>
                </div>

                {/* Endpoints Table */}
              </CardContent>
            </Card>

            {/* Database Health */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.system.database.title')}</CardTitle>
                <CardDescription>{t('admin.system.database.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">{t('admin.system.metrics.connections')}</div>
                    <div className="text-2xl font-bold">
                      {systemHealth.database.connections} / {systemHealth.database.maxConnections}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t('admin.system.metrics.slow_queries')}</div>
                    <div className="text-2xl font-bold">{systemHealth.database.slowQueries}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">{t('admin.system.metrics.database_size')}</div>
                    <div className="text-2xl font-bold">{systemHealth.database.size} GB</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* External Services */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.system.external.title')}</CardTitle>
                <CardDescription>{t('admin.system.external.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(Object.entries(systemHealth.external) as [string, ExternalServiceStatus][]).map(([service, status]) => (
                    <div key={service} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium capitalize">{service}</div>
                        {getStatusIcon(status.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={status.status === 'healthy' ? 'default' : status.status === 'degraded' ? 'secondary' : 'destructive'}>
                          {t(`admin.system.status.${status.status}`)}
                        </Badge>
                        <span className="text-sm text-gray-600">{status.latency}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Background Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.system.jobs.title')}</CardTitle>
                <CardDescription>{t('admin.system.jobs.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(Object.entries(systemHealth.jobs) as [string, BackgroundJob][]).map(([jobName, job]) => (
                    <div key={jobName} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium capitalize">{jobName.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-sm text-gray-500">
                          {t('admin.system.metrics.last_run', { date: new Date(job.lastRun).toLocaleString() })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {job.status === 'success' ? (
                          <Badge variant="default">{t('admin.system.status.healthy')}</Badge>
                        ) : (
                          <Badge variant="destructive">{t('admin.system.status.down')}</Badge>
                        )}
                        {'sent' in job && (
                          <span className="text-sm text-gray-600">{job.sent} sent</span>
                        )}
                        {'deleted' in job && (
                          <span className="text-sm text-gray-600">{job.deleted} deleted</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}

