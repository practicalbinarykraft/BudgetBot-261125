/**
 * User Transactions Component
 *
 * Displays user's transaction history
 * Junior-Friendly: Simple table, filters, pagination
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt, Download, ExternalLink } from "lucide-react";
import { useTranslation } from "@/i18n/context";

interface Transaction {
  id: number;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  description: string;
  category: string;
  source: string;
  hasAttachment: boolean;
  attachmentUrl?: string;
}

interface UserTransactionsProps {
  userId: number;
}

export function UserTransactions({ userId }: UserTransactionsProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");

  const { data, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.userTransactions(userId),
    queryFn: () => adminApi.getUserTransactions(userId, { page, limit: 20, type: typeFilter || undefined }),
    enabled: !!userId,
  });

  const getTypeBadgeVariant = (type: string) => {
    return type === 'income' ? 'default' : 'secondary';
  };

  const getSourceBadge = (source: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      manual: 'outline',
      telegram: 'default',
      ocr: 'secondary',
    };
    return variants[source] || 'outline';
  };

  const handleExportStatement = async () => {
    try {
      // Fetch all transactions for export
      const allTransactions = await adminApi.getUserTransactions(userId, { all: true });
      
      if (!allTransactions?.transactions || allTransactions.transactions.length === 0) {
        return;
      }

      // Generate CSV content
      const csvContent = [
        ['Date', 'Type', 'Amount', 'Currency', 'Description', 'Category', 'Source', 'Receipt'].join(','),
        ...allTransactions.transactions.map((tx: Transaction) => [
          new Date(tx.date).toISOString().split('T')[0],
          tx.type,
          tx.type === 'income' ? `+${tx.amount.toFixed(2)}` : `-${tx.amount.toFixed(2)}`,
          tx.currency,
          `"${tx.description.replace(/"/g, '""')}"`,
          `"${tx.category.replace(/"/g, '""')}"`,
          tx.source,
          tx.hasAttachment ? 'Yes' : 'No',
        ].join(',')),
      ].join('\n');

      // Add BOM for Excel compatibility
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `user-${userId}-statement-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export statement:', error);
      alert(t('admin.user_transactions.export_failed'));
    }
  };

  const handleOpenReceipt = (transactionId: number) => {
    // TODO: Open receipt in modal or new tab
    // For now, just log - will be implemented with real API
    console.log('Open receipt for transaction:', transactionId);
    // In real implementation:
    // window.open(`/api/admin/users/${userId}/transactions/${transactionId}/receipt`, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('admin.user_transactions.title')}</CardTitle>
            <CardDescription>
              {data ? `${data.total} ${t('admin.user_transactions.total_transactions')}` : t('admin.common.loading')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportStatement}
              disabled={!data || data.transactions.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('admin.user_transactions.export_statement')}
            </Button>
            <Select value={typeFilter || "all"} onValueChange={(value) => {
              setTypeFilter(value === "all" ? "" : value);
              setPage(1);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('admin.user_transactions.filter_type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.user_transactions.all_types')}</SelectItem>
                <SelectItem value="income">{t('admin.transaction_type.income')}</SelectItem>
                <SelectItem value="expense">{t('admin.transaction_type.expense')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
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
            {t('admin.user_transactions.failed_to_load')}
          </div>
        ) : data && data.transactions.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.user_transactions.table.date')}</TableHead>
                  <TableHead>{t('admin.user_transactions.table.type')}</TableHead>
                  <TableHead>{t('admin.user_transactions.table.amount')}</TableHead>
                  <TableHead>{t('admin.user_transactions.table.description')}</TableHead>
                  <TableHead>{t('admin.user_transactions.table.category')}</TableHead>
                  <TableHead>{t('admin.user_transactions.table.source')}</TableHead>
                  <TableHead>{t('admin.user_transactions.table.receipt')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.transactions.map((transaction: Transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(transaction.type)}>
                        {t(`admin.transaction_type.${transaction.type}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.type === 'income' ? '+' : '-'}
                      ${transaction.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell>
                      <Badge variant={getSourceBadge(transaction.source)}>
                        {t(`admin.transaction_source.${transaction.source}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {transaction.hasAttachment ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenReceipt(transaction.id)}
                          className="h-8 px-2"
                        >
                          <Receipt className="h-4 w-4 text-green-600 mr-2" />
                          <span className="text-sm">{t('admin.user_transactions.open_receipt')}</span>
                        </Button>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data.total > 20 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Page {page} of {Math.ceil(data.total / 20)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(Math.ceil(data.total / 20), p + 1))}
                    disabled={page >= Math.ceil(data.total / 20)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            {t('admin.user_transactions.no_transactions_found')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

