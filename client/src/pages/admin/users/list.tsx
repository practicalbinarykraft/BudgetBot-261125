/**
 * Admin Users List Page
 *
 * List of all users with filters and search
 * Junior-Friendly: Uses TanStack Query, simple state management
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, ArrowRight } from "lucide-react";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/i18n/context";

interface AdminUser {
  id: number;
  name: string;
  email: string | null;
  status: string;
  plan: string;
  createdAt: string | Date;
  lastActiveAt?: string | Date;
  transactionsCount?: number;
  mrr?: number;
  creditsSpent?: number;
  creditsRemaining?: number;
  totalRevenue?: number;
  totalSpent?: number;
  revenueToCreditsRatio?: number;
  credits?: {
    spent: number;
    remaining: number;
    total: number;
    used?: number;
  };
  telegram?: {
    id: string | null;
    username: string | null;
  };
}

export default function AdminUsersListPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [planFilter, setPlanFilter] = useState<string>("");

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.users({ page, limit: 20, search, status: statusFilter, plan: planFilter }),
    queryFn: () => adminApi.getUsers({ page, limit: 20, search, status: statusFilter, plan: planFilter }),
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'blocked': return 'destructive';
      case 'churned': return 'outline';
      default: return 'secondary';
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'pro': return 'default';
      case 'starter': return 'secondary';
      case 'byok': return 'outline';
      case 'free': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('admin.users.title')}</h1>
            <p className="text-gray-600 mt-1">
              {t('admin.users.description')}
            </p>
          </div>
          <Button>{t('admin.users.export_csv')}</Button>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.users.search_placeholder')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t('admin.users.search_placeholder')}
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)} disabled={isLoading}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('admin.users.filter_status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.users.all_statuses')}</SelectItem>
                  <SelectItem value="active">{t('admin.status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('admin.status.inactive')}</SelectItem>
                  <SelectItem value="blocked">{t('admin.status.blocked')}</SelectItem>
                  <SelectItem value="churned">{t('admin.status.churned')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter || "all"} onValueChange={(value) => setPlanFilter(value === "all" ? "" : value)} disabled={isLoading}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('admin.users.filter_plan')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.users.all_plans')}</SelectItem>
                  <SelectItem value="free">{t('admin.plan.free')}</SelectItem>
                  <SelectItem value="byok">{t('admin.plan.byok')}</SelectItem>
                  <SelectItem value="starter">{t('admin.plan.starter')}</SelectItem>
                  <SelectItem value="pro">{t('admin.plan.pro')}</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={isLoading}>{t('admin.users.apply_filters')}</Button>
            </form>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.users.title')}</CardTitle>
            <CardDescription>{data ? `${data.total} ${t('admin.users.total_users')}` : t('admin.common.loading')}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-600">
                {t('admin.common.error')}: {error?.message || String(error)}
              </div>
            ) : data && data.users.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                {t('admin.users.no_users')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('admin.users.table.name')}</TableHead>
                      <TableHead>{t('admin.users.table.email')}</TableHead>
                      <TableHead>{t('admin.users.table.telegram')}</TableHead>
                      <TableHead>{t('admin.users.table.status')}</TableHead>
                      <TableHead>{t('admin.users.table.plan')}</TableHead>
                      <TableHead>{t('admin.users.table.last_active')}</TableHead>
                      <TableHead>{t('admin.users.table.signed_up')}</TableHead>
                      <TableHead>{t('admin.users.table.transactions')}</TableHead>
                      <TableHead>{t('admin.users.table.mrr')}</TableHead>
                      <TableHead>{t('admin.users.table.credits_spent')}</TableHead>
                      <TableHead>{t('admin.users.table.credits_remaining')}</TableHead>
                      <TableHead>{t('admin.users.table.revenue')}</TableHead>
                      <TableHead>{t('admin.users.table.ratio')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.users.map((user: AdminUser) => {
                      try {
                      // Safe date formatting
                      const formatDate = (date: Date | string | undefined): string => {
                        if (!date) return 'N/A';
                        try {
                          const dateObj = date instanceof Date ? date : new Date(date);
                          if (isNaN(dateObj.getTime())) return 'N/A';
                          return dateObj.toLocaleDateString();
                        } catch {
                          return 'N/A';
                        }
                      };

                      // Safe number formatting
                      const formatNumber = (value: number | undefined, decimals: number = 2): string => {
                        if (value === undefined || value === null || isNaN(value)) return '0.00';
                        return value.toFixed(decimals);
                      };

                      // Safe credits calculation
                      const creditsUsed = user.credits?.used ?? 0;
                      const creditsTotal = user.credits?.total ?? 0;
                      const creditsRemaining = user.credits?.remaining ?? 0;
                      const totalSpent = user.totalSpent ?? 0;
                      const mrr = user.mrr ?? 0;

                      // Calculate ratio safely
                      const calculateRatio = (): string => {
                        if (totalSpent <= 0) return 'N/A';
                        const costSpent = creditsUsed * 0.01;
                        if (costSpent <= 0) return '0.000';
                        const ratio = costSpent / totalSpent;
                        if (isNaN(ratio) || !isFinite(ratio)) return 'N/A';
                        return ratio.toFixed(3);
                      };

                      return (
                        <TableRow key={user.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            <Link href={`/admin/users/${user.id}`} className="font-medium text-blue-600 hover:underline">
                              {user.name}
                            </Link>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.telegram?.username ? `@${user.telegram.username}` : 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(user.status)}>
                              {t(`admin.status.${user.status}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPlanBadgeVariant(user.plan)}>
                              {t(`admin.plan.${user.plan}`)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.lastActiveAt)}</TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>{user.transactionsCount ?? 0}</TableCell>
                          <TableCell>${formatNumber(mrr)}</TableCell>
                          <TableCell>
                            {creditsUsed} <span className="text-gray-500">(${formatNumber(creditsUsed * 0.01)})</span>
                          </TableCell>
                          <TableCell>
                            {creditsRemaining} / {creditsTotal}
                          </TableCell>
                          <TableCell>${formatNumber(totalSpent)}</TableCell>
                          <TableCell>
                            {calculateRatio()}
                          </TableCell>
                        </TableRow>
                      );
                      } catch (err) {
                        return (
                          <TableRow key={user.id}>
                            <TableCell colSpan={13} className="text-red-600">
                              Error rendering user {user.id}: {err instanceof Error ? err.message : String(err)}
                            </TableCell>
                          </TableRow>
                        );
                      }
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex justify-end items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1 || isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> {t('admin.users.pagination.previous')}
                </Button>
                <span className="text-sm text-gray-700">
                  {t('admin.users.pagination.page')} {page} {t('admin.users.pagination.of')} {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(prev => Math.min(data.totalPages, prev + 1))}
                  disabled={page === data.totalPages || isLoading}
                >
                  {t('admin.users.pagination.next')} <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

