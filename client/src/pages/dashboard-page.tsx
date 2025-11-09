import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { StatCard } from "@/components/dashboard/stat-card";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: stats } = useQuery<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }>({
    queryKey: ["/api/stats"],
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
        <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-transaction">
          <Plus className="h-4 w-4 mr-2" />
          Add Transaction
        </Button>
      </div>

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
        />
        <StatCard
          title="Balance"
          value={`$${stats?.balance?.toFixed(2) ?? "0.00"}`}
          icon={Wallet}
          className="border-l-4 border-l-primary"
        />
      </div>

      <SpendingChart transactions={transactions} />

      <TransactionList transactions={recentTransactions} />

      <AddTransactionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
