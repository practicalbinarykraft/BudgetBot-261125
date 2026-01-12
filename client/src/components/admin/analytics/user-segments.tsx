/**
 * User Segments Component
 *
 * Displays predefined and custom user segments
 * Junior-Friendly: Simple cards, clear structure
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Filter, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/context";

export function UserSegments() {
  const { t } = useTranslation();
  const { data: segmentsData, isLoading } = useQuery({
    queryKey: adminQueryKeys.userSegments,
    queryFn: () => adminApi.getUserSegments(),
  });

  // Обрабатываем структуру ответа: может быть массив (mock) или объект { segments, totalUsers }
  const segments = Array.isArray(segmentsData) 
    ? segmentsData 
    : segmentsData?.segments || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.analytics.user_segments.title')}</CardTitle>
          <CardDescription>{t('admin.analytics.user_segments.description')}</CardDescription>
        </CardHeader>
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('admin.analytics.user_segments.title')}</CardTitle>
            <CardDescription>{t('admin.analytics.user_segments.description')}</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            {t('admin.analytics.user_segments.create_custom')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((segment) => (
            <div
              key={segment.name}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <h4 className="font-medium">
                    {/* Поддержка обеих структур: segment (API) или name (mock) */}
                    {'segment' in segment ? segment.segment : segment.name}
                  </h4>
                </div>
                <Badge variant="outline">{segment.count}</Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">{segment.description}</p>
              <div className="flex items-center justify-between mt-3">
                {'percentage' in segment && (
                  <span className="text-xs text-gray-500">
                    {segment.percentage.toFixed(1)}% от всех пользователей
                  </span>
                )}
                {'criteria' in segment && (
                  <code className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {segment.criteria}
                  </code>
                )}
                <Button variant="ghost" size="sm">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

