import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Budget, Category, Transaction } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, TrendingDown, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBudgetSchema } from "@shared/schema";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from "date-fns";

type FormData = z.infer<typeof insertBudgetSchema>;

function getBudgetPeriodDates(budget: Budget): { start: Date; end: Date } {
  const startDate = new Date(budget.startDate);
  
  switch (budget.period) {
    case "week":
      return {
        start: startOfWeek(startDate, { weekStartsOn: 1 }),
        end: endOfWeek(startDate, { weekStartsOn: 1 }),
      };
    case "month":
      return {
        start: startOfMonth(startDate),
        end: endOfMonth(startDate),
      };
    case "year":
      return {
        start: startOfYear(startDate),
        end: endOfYear(startDate),
      };
    default:
      return { start: startDate, end: startDate };
  }
}

function calculateBudgetProgress(
  budget: Budget,
  transactions: Transaction[],
  categoryName: string
): { spent: number; percentage: number; status: "ok" | "warning" | "exceeded" } {
  const { start, end } = getBudgetPeriodDates(budget);
  
  const categoryTransactions = transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return (
      t.category === categoryName &&
      t.type === "expense" &&
      transactionDate >= start &&
      transactionDate <= end
    );
  });

  const spent = categoryTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amountUsd),
    0
  );

  const limitAmount = parseFloat(budget.limitAmount);
  const percentage = limitAmount > 0 ? (spent / limitAmount) * 100 : 0;

  let status: "ok" | "warning" | "exceeded" = "ok";
  if (percentage >= 100) {
    status = "exceeded";
  } else if (percentage >= 80) {
    status = "warning";
  }

  return { spent, percentage, status };
}

function BudgetCard({
  budget,
  category,
  progress,
  onEdit,
  onDelete,
}: {
  budget: Budget;
  category?: Category;
  progress: { spent: number; percentage: number; status: "ok" | "warning" | "exceeded" };
  onEdit: () => void;
  onDelete: () => void;
}) {
  const limitAmount = parseFloat(budget.limitAmount);
  
  const statusColors = {
    ok: "bg-green-500",
    warning: "bg-yellow-500",
    exceeded: "bg-red-500",
  };

  const statusMessages = {
    ok: "Within budget",
    warning: "Approaching limit",
    exceeded: "Budget exceeded",
  };

  return (
    <Card className="hover-elevate" data-testid={`budget-${budget.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="h-3 w-3 rounded-full flex-shrink-0 bg-muted-foreground"
            style={category?.color ? { backgroundColor: category.color } : undefined}
          />
          <h3 className="font-semibold truncate">{category?.name || "Unknown"}</h3>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={onEdit}
            data-testid={`button-edit-budget-${budget.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDelete}
            data-testid={`button-delete-budget-${budget.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {budget.period === "week" ? "Weekly" : budget.period === "month" ? "Monthly" : "Yearly"} limit
          </span>
          <span className="font-mono font-semibold">${limitAmount.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Spent</span>
            <span className={`font-mono font-semibold ${progress.status === "exceeded" ? "text-red-600 dark:text-red-400" : ""}`}>
              ${progress.spent.toFixed(2)}
            </span>
          </div>
          <Progress
            value={Math.min(progress.percentage, 100)}
            className="h-2"
            indicatorClassName={statusColors[progress.status]}
            data-testid={`progress-budget-${budget.id}`}
          />
          <div className="flex items-center justify-between text-xs">
            <span className={`${progress.status === "exceeded" ? "text-red-600 dark:text-red-400 font-semibold" : "text-muted-foreground"}`}>
              {progress.percentage.toFixed(0)}% used
            </span>
            <span className="text-muted-foreground">
              ${Math.max(0, limitAmount - progress.spent).toFixed(2)} remaining
            </span>
          </div>
        </div>

        {progress.status !== "ok" && (
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className={`h-3 w-3 flex-shrink-0 ${
              progress.status === "exceeded" ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"
            }`} />
            <span className={progress.status === "exceeded" ? "text-red-600 dark:text-red-400" : "text-yellow-600 dark:text-yellow-400"}>
              {statusMessages[progress.status]}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BudgetsPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const { user } = useAuth();
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

  const form = useForm<FormData>({
    resolver: zodResolver(insertBudgetSchema),
    defaultValues: {
      userId: user?.id || 0,
      categoryId: 0,
      limitAmount: "0",
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
      form.reset({
        userId: user?.id || 0,
        categoryId: 0,
        limitAmount: "0",
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
    form.reset({
      userId: budget.userId,
      categoryId: budget.categoryId,
      limitAmount: budget.limitAmount,
      period: budget.period as "week" | "month" | "year",
      startDate: budget.startDate,
    });
    setShowAddDialog(true);
  };

  const handleAddNew = () => {
    setEditingBudget(null);
    form.reset({
      userId: user?.id || 0,
      categoryId: 0,
      limitAmount: "0",
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
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first budget to start tracking your spending
            </p>
            <Button onClick={handleAddNew} data-testid="button-add-first-budget">
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const category = categories.find((c) => c.id === budget.categoryId);
            const progress = category 
              ? calculateBudgetProgress(budget, transactions, category.name)
              : { spent: 0, percentage: 0, status: "ok" as const };
            
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

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent data-testid="dialog-budget-form">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Budget" : "Add Budget"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {expenseCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full bg-muted-foreground"
                                style={category.color ? { backgroundColor: category.color } : undefined}
                              />
                              {category.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="limitAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limit Amount (USD)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="100.00"
                        {...field}
                        data-testid="input-limit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-period">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="week">Weekly</SelectItem>
                        <SelectItem value="month">Monthly</SelectItem>
                        <SelectItem value="year">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-start-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit"
                >
                  {editingBudget ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
