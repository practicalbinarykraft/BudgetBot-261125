import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown } from "lucide-react";

export function BudgetEmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No budgets yet</h3>
        <p className="text-muted-foreground mb-4">
          Create your first budget to start tracking your spending
        </p>
        <Button onClick={onAddClick} data-testid="button-add-first-budget">
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      </CardContent>
    </Card>
  );
}
