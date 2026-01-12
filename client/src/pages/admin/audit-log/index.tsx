/**
 * Admin Audit Log Page
 *
 * Displays all audit logs for security and compliance
 * Junior-Friendly: Simple table, clear filters
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download } from "lucide-react";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/i18n/context";

interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  entityType: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AdminAuditLogPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("");
  const [userIdFilter, setUserIdFilter] = useState<string>("");

  const limit = 50;
  const offset = (page - 1) * limit;

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.auditLogs({
      limit,
      offset,
      userId: userIdFilter ? parseInt(userIdFilter) : undefined,
      action: actionFilter || undefined,
      entityType: entityTypeFilter || undefined,
    }),
    queryFn: () => adminApi.getAuditLogs({
      limit,
      offset,
      userId: userIdFilter ? parseInt(userIdFilter) : undefined,
      action: actionFilter || undefined,
      entityType: entityTypeFilter || undefined,
    }),
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('create')) return 'default';
    if (action.includes('update')) return 'secondary';
    if (action.includes('delete')) return 'destructive';
    if (action.includes('login') || action.includes('register')) return 'outline';
    return 'secondary';
  };

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.audit_log.title')}</h1>
            <p className="text-gray-600 mt-1">
              {t('admin.audit_log.description')}
            </p>
          </div>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            {t('admin.audit_log.export')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.audit_log.filters_title')}</CardTitle>
            <CardDescription>{t('admin.audit_log.filters_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('admin.audit_log.search_user_id')}
                  className="pl-10"
                  value={userIdFilter}
                  onChange={(e) => {
                    setUserIdFilter(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <Select value={actionFilter || "all"} onValueChange={(value) => {
                setActionFilter(value === "all" ? "" : value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.audit_log.filter_action')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.audit_log.all_actions')}</SelectItem>
                  <SelectItem value="login">{t('admin.audit_log.action.login')}</SelectItem>
                  <SelectItem value="logout">{t('admin.audit_log.action.logout')}</SelectItem>
                  <SelectItem value="register">{t('admin.audit_log.action.register')}</SelectItem>
                  <SelectItem value="create">{t('admin.audit_log.action.create')}</SelectItem>
                  <SelectItem value="update">{t('admin.audit_log.action.update')}</SelectItem>
                  <SelectItem value="delete">{t('admin.audit_log.action.delete')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={entityTypeFilter || "all"} onValueChange={(value) => {
                setEntityTypeFilter(value === "all" ? "" : value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin.audit_log.filter_entity')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.audit_log.all_entities')}</SelectItem>
                  <SelectItem value="transaction">{t('admin.audit_log.entity.transaction')}</SelectItem>
                  <SelectItem value="wallet">{t('admin.audit_log.entity.wallet')}</SelectItem>
                  <SelectItem value="budget">{t('admin.audit_log.entity.budget')}</SelectItem>
                  <SelectItem value="category">{t('admin.audit_log.entity.category')}</SelectItem>
                  <SelectItem value="user">{t('admin.audit_log.entity.user')}</SelectItem>
                  <SelectItem value="settings">{t('admin.audit_log.entity.settings')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setUserIdFilter("");
                  setActionFilter("");
                  setEntityTypeFilter("");
                  setPage(1);
                }}
              >
                {t('admin.audit_log.clear_filters')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.audit_log.all_logs')}</CardTitle>
            <CardDescription>
              {total} {t('admin.audit_log.total_entries')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                {t('admin.audit_log.failed_to_load')}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {t('admin.audit_log.no_logs_found')}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.audit_log.table.timestamp')}</TableHead>
                        <TableHead>{t('admin.audit_log.table.user')}</TableHead>
                        <TableHead>{t('admin.audit_log.table.action')}</TableHead>
                        <TableHead>{t('admin.audit_log.table.entity')}</TableHead>
                        <TableHead>{t('admin.audit_log.table.entity_id')}</TableHead>
                        <TableHead>{t('admin.audit_log.table.ip')}</TableHead>
                        <TableHead>{t('admin.audit_log.table.user_agent')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log: AuditLog) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {log.userId ? (
                              <a
                                href={`/admin/users/${log.userId}`}
                                className="text-blue-600 hover:underline"
                              >
                                User #{log.userId}
                              </a>
                            ) : (
                              <span className="text-gray-400">{t('admin.common.na')}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionBadgeVariant(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.entityType}</TableCell>
                          <TableCell>
                            {log.entityId ? (
                              <span className="font-mono text-sm">{log.entityId}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.ipAddress || <span className="text-gray-400">-</span>}
                          </TableCell>
                          <TableCell className="text-xs text-gray-600 max-w-xs truncate">
                            {log.userAgent || <span className="text-gray-400">-</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-end items-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1 || isLoading}
                    >
                      {t('admin.common.previous')}
                    </Button>
                    <span className="text-sm text-gray-700">
                      {t('admin.common.page', { page, totalPages })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={page === totalPages || isLoading}
                    >
                      {t('admin.common.next')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

