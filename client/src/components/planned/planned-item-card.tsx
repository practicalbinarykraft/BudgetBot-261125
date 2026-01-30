import { PlannedTransaction } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Check, X, Calendar } from "lucide-react";
import { format, parseISO, isPast, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import { useTranslation } from "@/i18n";
import { useTranslateCategory } from "@/lib/category-translations";

interface PlannedItemCardProps {
  item: PlannedTransaction;
  onDelete: (id: number) => void;
  onPurchase: (id: number) => void;
  onCancel: (id: number) => void;
  onToggleChart?: (id: number, show: boolean) => void;
}

const statusColors = {
  planned: "bg-blue-500",
  purchased: "bg-green-500",
  cancelled: "bg-gray-500",
};

export function PlannedItemCard({ item, onDelete, onPurchase, onCancel, onToggleChart }: PlannedItemCardProps) {
  const { t, language } = useTranslation();
  const translateCategory = useTranslateCategory();
  const targetDate = parseISO(item.targetDate);
  const isOverdue = isPast(targetDate) && item.status === "planned";
  const daysUntil = differenceInDays(targetDate, new Date());
  const isDueSoon = daysUntil >= 0 && daysUntil <= 7 && item.status === "planned";
  
  // Format date with locale
  const formatDate = (date: Date) => {
    return format(date, "MMM dd, yyyy", { locale: language === 'ru' ? ru : undefined });
  };
  
  // Get status translation
  const getStatusLabel = (status: string) => {
    return t(`planned.status.${status}`) || status;
  };
  
  // Format "due in X days" text
  const getDueText = () => {
    if (isOverdue) {
      return t("planned.overdue_label");
    }
    if (isDueSoon) {
      if (daysUntil === 1) {
        return t("planned.due_in_one_day");
      }
      return t("planned.due_in_days").replace("{days}", String(daysUntil));
    }
    return formatDate(targetDate);
  };

  return (
    <Card className="hover-elevate" data-testid={`planned-${item.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-lg">{item.name}</h3>
            <p className="text-2xl font-mono font-bold mt-2">${item.amount}</p>
            {item.category && (
              <p className="text-sm text-muted-foreground mt-1">{translateCategory(item.category)}</p>
            )}
          </div>
          <div className={`w-2 h-2 rounded-full ${statusColors[item.status as keyof typeof statusColors]}`} />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <p className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : isDueSoon ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
            {getDueText()}
          </p>
          <Badge variant="secondary" className="text-xs">
            {getStatusLabel(item.status)}
          </Badge>
        </div>

        {item.status === "planned" && onToggleChart && (
          <div className="flex items-center gap-2 mb-3">
            <Checkbox
              id={`show-chart-${item.id}`}
              checked={item.showOnChart ?? true}
              onCheckedChange={(checked) => onToggleChart(item.id, !!checked)}
              data-testid={`checkbox-show-chart-${item.id}`}
            />
            <label 
              htmlFor={`show-chart-${item.id}`} 
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              {t("planned.show_on_chart")}
            </label>
          </div>
        )}

        {item.status === "planned" && (
          <div className="flex gap-2 mt-3">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onPurchase(item.id)}
              data-testid={`button-purchase-${item.id}`}
            >
              <Check className="h-4 w-4 mr-2" />
              {t("planned.button_purchase")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onCancel(item.id)}
              data-testid={`button-cancel-${item.id}`}
            >
              <X className="h-4 w-4 mr-2" />
              {t("planned.button_cancel")}
            </Button>
          </div>
        )}

        {item.status !== "planned" && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3"
            onClick={() => onDelete(item.id)}
            data-testid={`button-delete-planned-${item.id}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("planned.button_remove")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
