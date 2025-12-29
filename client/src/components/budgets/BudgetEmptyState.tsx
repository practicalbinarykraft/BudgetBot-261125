import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingDown } from "lucide-react";
import { useTranslation } from "@/i18n/context";

export function BudgetEmptyState({ onAddClick }: { onAddClick: () => void }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <TrendingDown className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t("budgets.no_budgets")}</h3>
        <p className="text-muted-foreground mb-4">
          {t("budgets.create_first")}
        </p>
        <Button onClick={onAddClick} data-testid="button-add-first-budget">
          <Plus className="h-4 w-4 mr-2" />
          {t("budgets.add_budget")}
        </Button>
      </CardContent>
    </Card>
  );
}
