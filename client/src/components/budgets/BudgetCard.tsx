import { Budget, Category } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trash2, Pencil, AlertCircle } from "lucide-react";

export function BudgetCard({
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
