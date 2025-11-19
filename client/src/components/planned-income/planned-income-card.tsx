import { PlannedIncome, Category } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Check, X, Calendar, Edit } from "lucide-react";
import { format, parseISO, isPast, differenceInDays } from "date-fns";
import { useTranslation } from "@/i18n/context";

interface PlannedIncomeCardProps {
  income: PlannedIncome;
  categories: Category[];
  onDelete: (id: number) => void;
  onReceive: (id: number) => void;
  onCancel: (id: number) => void;
  onEdit?: (income: PlannedIncome) => void;
}

const statusColors = {
  pending: "bg-blue-500",
  received: "bg-green-500",
  cancelled: "bg-gray-500",
};

export function PlannedIncomeCard({
  income,
  categories,
  onDelete,
  onReceive,
  onCancel,
  onEdit,
}: PlannedIncomeCardProps) {
  const { t } = useTranslation();
  const expectedDate = parseISO(income.expectedDate);
  const isOverdue = isPast(expectedDate) && income.status === "pending";
  const daysUntil = differenceInDays(expectedDate, new Date());
  const isDueSoon = daysUntil >= 0 && daysUntil <= 7 && income.status === "pending";

  const category = categories.find((c) => c.id === income.categoryId);

  return (
    <Card className="hover-elevate" data-testid={`card-income-${income.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-lg" data-testid={`text-description-${income.id}`}>
              {income.description}
            </h3>
            <p className="text-2xl font-mono font-bold mt-2 text-green-600 dark:text-green-400" data-testid={`text-amount-${income.id}`}>
              +{income.amount} {income.currency || "USD"}
            </p>
            {category && (
              <p className="text-sm text-muted-foreground mt-1" data-testid={`text-category-${income.id}`}>
                {category.name}
              </p>
            )}
          </div>
          <div
            className={`w-2 h-2 rounded-full ${statusColors[income.status as keyof typeof statusColors]}`}
            data-testid={`indicator-status-${income.id}`}
          />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <p
            className={`text-xs ${
              isOverdue
                ? "text-red-500 font-medium"
                : isDueSoon
                  ? "text-yellow-600 font-medium"
                  : "text-muted-foreground"
            }`}
            data-testid={`text-date-${income.id}`}
          >
            {isOverdue
              ? `${t("planned_income.expected_on")} ${format(expectedDate, "MMM dd, yyyy")} (overdue)`
              : isDueSoon
                ? `${t("planned_income.expected_on")} ${format(expectedDate, "MMM dd")} (${daysUntil}d)`
                : `${t("planned_income.expected_on")} ${format(expectedDate, "MMM dd, yyyy")}`}
          </p>
          <Badge variant="secondary" className="text-xs capitalize" data-testid={`badge-status-${income.id}`}>
            {t(`planned_income.status.${income.status}`)}
          </Badge>
        </div>

        {income.notes && (
          <p className="text-sm text-muted-foreground mb-3 italic" data-testid={`text-notes-${income.id}`}>
            {income.notes}
          </p>
        )}

        {income.status === "pending" && (
          <div className="flex gap-2 mt-3">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onReceive(income.id)}
              data-testid={`button-receive-${income.id}`}
            >
              <Check className="h-4 w-4 mr-2" />
              {t("planned_income.action.receive")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(income.id)}
              data-testid={`button-cancel-${income.id}`}
            >
              <X className="h-4 w-4 mr-2" />
              {t("planned_income.action.cancel")}
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(income)}
                data-testid={`button-edit-${income.id}`}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {income.status !== "pending" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={() => onDelete(income.id)}
            data-testid={`button-delete-${income.id}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("common.delete")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
