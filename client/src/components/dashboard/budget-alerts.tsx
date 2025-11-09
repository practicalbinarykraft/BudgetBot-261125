import { useQuery } from "@tanstack/react-query";
import { Budget, Category, Transaction } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, TrendingDown } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
// ⏰ Budget calculation helpers extracted to separate file for reusability
import { calculateBudgetProgress } from "@/lib/budget-helpers";

export function BudgetAlerts() {
  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  if (budgets.length === 0) {
    return null;
  }

  const problematicBudgets = budgets
    .map((budget) => {
      const category = categories.find((c) => c.id === budget.categoryId);
      if (!category) return null;
      
      const progress = calculateBudgetProgress(budget, transactions, category.name);
      
      if (progress.status === "ok") return null;
      
      return {
        budget,
        category,
        progress,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (problematicBudgets.length === 0) {
    return null;
  }

  const exceededBudgets = problematicBudgets.filter((b) => b.progress.status === "exceeded");
  const warningBudgets = problematicBudgets.filter((b) => b.progress.status === "warning");

  return (
    <div className="space-y-4" data-testid="budget-alerts">
      {exceededBudgets.length > 0 && (
        <Alert variant="destructive" data-testid="alert-budgets-exceeded">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Budget Exceeded</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {exceededBudgets.length === 1
                ? "1 budget has exceeded its limit:"
                : `${exceededBudgets.length} budgets have exceeded their limits:`}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {exceededBudgets.map(({ budget, category, progress }) => (
                <li key={budget.id}>
                  <strong>{category.name}</strong>: ${progress.spent.toFixed(2)} / ${parseFloat(budget.limitAmount).toFixed(2)} ({progress.percentage.toFixed(0)}%)
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <Link href="/budgets">
                <Button variant="outline" size="sm" data-testid="button-view-budgets">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Manage Budgets
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {warningBudgets.length > 0 && (
        <Alert data-testid="alert-budgets-warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Budget Warning</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              {warningBudgets.length === 1
                ? "1 budget is approaching its limit (80%+):"
                : `${warningBudgets.length} budgets are approaching their limits (80%+):`}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {warningBudgets.map(({ budget, category, progress }) => (
                <li key={budget.id}>
                  <strong>{category.name}</strong>: ${progress.spent.toFixed(2)} / ${parseFloat(budget.limitAmount).toFixed(2)} ({progress.percentage.toFixed(0)}%)
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
