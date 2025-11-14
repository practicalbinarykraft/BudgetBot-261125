import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { StatCard } from "@/components/dashboard/stat-card";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { FinancialTrendChart } from "@/components/charts/financial-trend-chart";
import { BudgetAlerts } from "@/components/dashboard/budget-alerts";
import { DateFilter, DateFilterValue, getDateRange } from "@/components/dashboard/date-filter";
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

export default function DashboardPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showCalibrateDialog, setShowCalibrateDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>("month");
  const { toast } = useToast();
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

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      // Invalidate all transaction queries (including date-filtered ones)
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"], exact: false });
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
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

  const recentTransactions = transactions.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Overview of your finances</p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your finances</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCalibrateDialog(true)} 
            data-testid="button-calibrate-wallets"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Calibrate Wallets
          </Button>
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-transaction">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      <DateFilter value={dateFilter} onChange={setDateFilter} />

      <BudgetAlerts />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Income"
          value={`$${stats?.totalIncome?.toFixed(2) ?? "0.00"}`}
          icon={TrendingUp}
          className="border-l-4 border-l-green-500"
        />
        <StatCard
          title="Total Expense"
          value={`$${stats?.totalExpense?.toFixed(2) ?? "0.00"}`}
          icon={TrendingDown}
          className="border-l-4 border-l-red-500"
          action={
            <Link href="/expenses/analytics">
              <a className="text-sm text-primary hover:underline flex items-center gap-1" data-testid="link-view-analytics">
                View Details <ArrowRight className="h-3 w-3" />
              </a>
            </Link>
          }
        />
        <StatCard
          title="Balance"
          value={`$${stats?.balance?.toFixed(2) ?? "0.00"}`}
          icon={Wallet}
          className="border-l-4 border-l-primary"
        />
      </div>

      <FinancialTrendChart />

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
