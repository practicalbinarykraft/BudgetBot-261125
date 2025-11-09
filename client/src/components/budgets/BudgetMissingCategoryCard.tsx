import { Budget } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function BudgetMissingCategoryCard({
  budget,
}: {
  budget: Budget;
}) {
  const limitAmount = parseFloat(budget.limitAmount);
  
  return (
    <Card className="border-destructive/50 bg-destructive/5" data-testid={`budget-missing-${budget.id}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-3 w-3 rounded-full flex-shrink-0 bg-destructive" />
          <h3 className="font-semibold truncate text-destructive">Unknown Category</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            This budget's category was deleted. This budget will be automatically removed. Please refresh the page.
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center justify-between text-sm opacity-60">
          <span className="text-muted-foreground">
            {budget.period === "week" ? "Weekly" : budget.period === "month" ? "Monthly" : "Yearly"} limit
          </span>
          <span className="font-mono font-semibold">${limitAmount.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
