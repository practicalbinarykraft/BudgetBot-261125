import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Budget, Category, Transaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetSchema } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { calculateBudgetProgress } from "@/lib/budget-helpers";
import { BudgetMissingCategoryCard } from "@/components/budgets/BudgetMissingCategoryCard";
import { BudgetCard } from "@/components/budgets/BudgetCard";
import { BudgetFormDialog } from "@/components/budgets/BudgetFormDialog";
import { BudgetEmptyState } from "@/components/budgets/BudgetEmptyState";

type FormData = z.infer<typeof insertBudgetSchema>;

export default function BudgetsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  // 🔒 Security: userId is NOT sent from client anymore!
  // Backend adds userId from authenticated session (req.user.id)
  const form = useForm<FormData>({
    resolver: zodResolver(insertBudgetSchema),
    defaultValues: {
      // userId removed - backend handles it from session
      categoryId: 0,
      limitAmount: 0,
      period: "month",
      startDate: format(new Date(), "yyyy-MM-dd"),
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/budgets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget created successfully",
      });
      // Reset form to default values (userId removed)
      form.reset({
        categoryId: 0,
        limitAmount: 0,
        period: "month" as const,
        startDate: format(new Date(), "yyyy-MM-dd"),
      });
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<FormData> }) => {
      const res = await apiRequest("PATCH", `/api/budgets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget updated successfully",
      });
      setEditingBudget(null);
      setShowAddDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/budgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
      toast({
        title: "Success",
        description: "Budget deleted successfully",
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

  const onSubmit = (data: FormData) => {
    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    // Fill form with budget data (userId removed - not editable)
    form.reset({
      categoryId: budget.categoryId,
      limitAmount: parseFloat(budget.limitAmount), // Convert DB string to number
      period: budget.period as "week" | "month" | "year",
      startDate: budget.startDate,
    });
    setShowAddDialog(true);
  };

  const handleAddNew = () => {
    setEditingBudget(null);
    // Reset form to default values (userId removed - handled by backend)
    form.reset({
      categoryId: 0,
      limitAmount: 0,
      period: "month" as const,
      startDate: format(new Date(), "yyyy-MM-dd"),
    });
    setShowAddDialog(true);
  };

  if (budgetsLoading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const exceededBudgets = budgets.filter((b) => {
    const category = categories.find((c) => c.id === b.categoryId);
    if (!category) return false;
    const progress = calculateBudgetProgress(b, transactions, category.name);
    return progress.status === "exceeded";
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground">Track your spending limits</p>
        </div>
        <Button onClick={handleAddNew} data-testid="button-add-budget">
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      </div>

      {exceededBudgets.length > 0 && (
        <Alert variant="destructive" data-testid="alert-exceeded-budgets">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {exceededBudgets.length} {exceededBudgets.length === 1 ? "budget has" : "budgets have"} exceeded their limit
          </AlertDescription>
        </Alert>
      )}

      {budgets.length === 0 ? (
        <BudgetEmptyState onAddClick={handleAddNew} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const category = categories.find((c) => c.id === budget.categoryId);
            
            // 🚨 If category missing (deleted before CASCADE), show special card
            // Edit/Delete disabled - CASCADE will clean up automatically
            if (!category) {
              return (
                <BudgetMissingCategoryCard
                  key={budget.id}
                  budget={budget}
                />
              );
            }
            
            const progress = calculateBudgetProgress(budget, transactions, category.name);
            
            return (
              <BudgetCard
                key={budget.id}
                budget={budget}
                category={category}
                progress={progress}
                onEdit={() => handleEdit(budget)}
                onDelete={() => deleteMutation.mutate(budget.id)}
              />
            );
          })}
        </div>
      )}

      <BudgetFormDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        form={form}
        onSubmit={onSubmit}
        editingBudget={!!editingBudget}
        expenseCategories={expenseCategories}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
