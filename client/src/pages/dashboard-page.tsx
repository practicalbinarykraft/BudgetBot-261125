import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { WishlistItemWithPrediction } from "@/types/goal-prediction";
import { NetWorthSummary } from "@/lib/types/assets";
import { StatCard } from "@/components/dashboard/stat-card";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { FinancialTrendChart } from "@/components/charts/financial-trend-chart";
import { BudgetAlerts } from "@/components/dashboard/budget-alerts";
import { DateFilter, DateFilterValue, getDateRange } from "@/components/dashboard/date-filter";
import { NetWorthWidget } from "@/components/assets/net-worth-widget";
import { TrendingUp, TrendingDown, Wallet, Settings2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog";
import { CalibrationDialog } from "@/components/wallets/calibration-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useTranslation } from "@/i18n";

export default function DashboardPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCalibrateDialog, setShowCalibrateDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("month");
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const dateRange = getDateRange(dateFilter);
  const queryParams = dateRange 
    ? `?from=${dateRange.from}&to=${dateRange.to}` 
    : "";

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/transactions${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const { data: stats } = useQuery<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }>({
    queryKey: ["/api/stats", dateRange],
    queryFn: async () => {
      const res = await fetch(`/api/stats${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  const { data: wishlistItems = [] } = useQuery<WishlistItemWithPrediction[]>({
    queryKey: ["/api/wishlist"],
  });

  const { data: netWorthResponse } = useQuery<{
    success: boolean;
    data: NetWorthSummary;
  }>({
    queryKey: ["/api/assets/summary"],
  });
  
  const netWorthSummary = netWorthResponse?.data;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      // Invalidate all transaction queries (including date-filtered ones)
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/sorting/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/unsorted"], exact: false });
      toast({
        title: t("common.success"),
        description: t("transaction.deleted"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Умное форматирование сумм
  const formatCurrency = (value: number) => {
    const safeValue = value ?? 0;
    if (Math.abs(safeValue) >= 1000000) {
      return `$${(safeValue / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(safeValue) >= 1000) {
      return `$${(safeValue / 1000).toFixed(0)}K`;
    }
    return `$${safeValue.toFixed(0)}`;
  };

  const recentTransactions = transactions.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
            <p className="text-muted-foreground">{t("dashboard.overview")}</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("dashboard.title")}</h1>
          <p className="text-muted-foreground">{t("dashboard.overview")}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCalibrateDialog(true)} 
            data-testid="button-calibrate-wallets"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {t("dashboard.calibrate_wallets")}
          </Button>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-transaction">
            <Plus className="h-4 w-4 mr-2" />
            {t("dashboard.add_transaction")}
          </Button>
        </div>
      </div>

      <DateFilter value={dateFilter} onChange={setDateFilter} />

      <BudgetAlerts />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.total_income")}
          value={`$${stats?.totalIncome?.toFixed(2) ?? "0.00"}`}
          icon={TrendingUp}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title={t("dashboard.total_expense")}
          value={`$${stats?.totalExpense?.toFixed(2) ?? "0.00"}`}
          icon={TrendingDown}
          className="border-l-4 border-l-red-500"
          action={
            <Link href="/app/expenses/analytics">
              <span className="text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer" data-testid="link-view-analytics">
                {t("dashboard.view_details")} <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          }
        />
        <StatCard
          title={t("dashboard.total_capital")}
          value={`$${((stats?.balance ?? 0) + (netWorthSummary?.netWorth ?? 0)).toFixed(2)}`}
          icon={Wallet}
          className="border-l-4 border-l-primary"
          action={
            <div className="text-xs text-muted-foreground space-y-0.5" data-testid="capital-breakdown">
              <div>{t("dashboard.wallets")}: ${(stats?.balance ?? 0).toFixed(0)}</div>
              {netWorthSummary && (
                <div>{t("dashboard.net_worth")}: ${(netWorthSummary.netWorth ?? 0).toFixed(0)}</div>
              )}
            </div>
          }
        />
        {netWorthSummary && (
          <StatCard
            title={t("assets.net_worth")}
            value={`$${(netWorthSummary.netWorth ?? 0).toFixed(0)}`}
            icon={Wallet}
            className="border-l-4 border-l-yellow-500"
            action={
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground space-y-0.5" data-testid="assets-breakdown">
                  <div>{t("assets.assets")}: {formatCurrency(netWorthSummary.totalAssets ?? 0)}</div>
                  <div>{t("assets.liabilities")}: {formatCurrency(netWorthSummary.totalLiabilities ?? 0)}</div>
                </div>
                <Link href="/app/assets">
                  <span className="text-sm text-primary hover:underline flex items-center gap-1 cursor-pointer" data-testid="link-view-assets">
                    {t("dashboard.view_details")} <ArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            }
          />
        )}
      </div>

      <FinancialTrendChart wishlistPredictions={wishlistItems} />

      <TransactionList 
        transactions={recentTransactions}
        onEdit={(transaction) => setEditingTransaction(transaction)}
        onDelete={(id) => deleteMutation.mutate(id)}
        showEdit={true}
        showDelete={true}
      />

      <AddTransactionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      <EditTransactionDialog
        transaction={editingTransaction}
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      />
      
      <CalibrationDialog
        open={showCalibrateDialog}
        onOpenChange={setShowCalibrateDialog}
      />
    </div>
  );
}
