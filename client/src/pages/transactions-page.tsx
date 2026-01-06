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
import { useTranslation } from "@/i18n/context";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export default function TransactionsPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: transactionsResponse, isLoading } = useQuery<{
    data: Transaction[];
    pagination: { total: number; limit: number; offset: number };
  }>({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  const transactions = transactionsResponse?.data ?? [];

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
        title: t("common.success"),
        description: t("transactions.deleted_successfully"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 pb-20 sm:pb-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-first header: stack on mobile, row on desktop */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("transactions.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t("transactions.manage")}</p>
        </div>
        <div className="flex gap-2">
          {unsortedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => setLocation('/transactions/sort')}
              data-testid="button-sort-transactions"
            >
              <Shuffle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">{t("transactions.sort_button")}</span>
              <span className="sm:hidden">({unsortedCount})</span>
              <span className="hidden sm:inline"> ({unsortedCount})</span>
            </Button>
          )}
          <Button
            size="sm"
            className="flex-1 sm:flex-none"
            onClick={() => setShowAddDialog(true)}
            data-testid="button-add-transaction-page"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{t("transactions.add_transaction")}</span>
            <span className="sm:hidden">{t("common.add")}</span>
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

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileBottomNav
          onMenuClick={() => setShowMobileMenu(true)}
          onAddClick={() => {
            toast({
              title: "Добавить транзакцию",
              description: "Функция скоро будет доступна!",
            });
          }}
          onAiChatClick={() => {
            toast({
              title: "AI Chat",
              description: "Функция AI чата скоро будет доступна!",
            });
          }}
        />
      )}

      <MobileMenuSheet
        open={showMobileMenu}
        onOpenChange={setShowMobileMenu}
      />
    </div>
  );
}
