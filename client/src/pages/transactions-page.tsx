import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Transaction } from "@shared/schema";
import { TransactionList } from "@/components/dashboard/transaction-list";
import { Button } from "@/components/ui/button";
import { Plus, Shuffle } from "lucide-react";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsPage() {
  const [, setLocation] = useLocation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  const { data: sortingStats } = useQuery<{ unsortedCount: number }>({
    queryKey: ['/api/sorting/stats'],
    enabled: !!user,
  });

  const unsortedCount = sortingStats?.unsortedCount ?? 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sorting/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/unsorted"], exact: false });
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">Manage all your income and expenses</p>
        </div>
        <div className="flex gap-2">
          {unsortedCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setLocation('/transactions/sort')}
              data-testid="button-sort-transactions"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Sort ({unsortedCount})
            </Button>
          )}
          <Button onClick={() => setShowAddDialog(true)} data-testid="button-add-transaction-page">
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        </div>
      </div>

      <TransactionList
        transactions={transactions}
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
    </div>
  );
}
