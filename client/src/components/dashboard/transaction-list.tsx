import { Transaction } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil } from "lucide-react";
// ⏰ parseISO prevents timezone bugs when parsing date strings from DB
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: number) => void;
  onEdit?: (transaction: Transaction) => void;
  showDelete?: boolean;
  showEdit?: boolean;
}

// Helper function to format date headers
function getDateHeader(dateStr: string, lang: string, t: (key: string) => string): string {
  const date = parseISO(dateStr);
  
  if (isToday(date)) {
    return t("dashboard.today");
  }
  
  if (isYesterday(date)) {
    return t("dashboard.yesterday");
  }
  
  // Format: "14 November" or "14 ноября"
  const locale = lang === 'ru' ? ru : enUS;
  return format(date, "d MMMM", { locale });
}

// Helper function to group transactions by date
function groupTransactionsByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  
  transactions.forEach(transaction => {
    // Normalize to calendar date (YYYY-MM-DD) to group same-day transactions
    const dateKey = format(parseISO(transaction.date), 'yyyy-MM-dd');
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(transaction);
  });
  
  return groups;
}

export function TransactionList({ transactions, onDelete, onEdit, showDelete = false, showEdit = false }: TransactionListProps) {
  const { t, language } = useTranslation();
  
  if (!transactions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.recent_transactions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("dashboard.no_transactions")}</p>
            <p className="text-sm mt-1">{t("dashboard.no_transactions_hint")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedTransactions = groupTransactionsByDate(transactions);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.recent_transactions")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from(groupedTransactions.entries()).map(([date, dateTransactions]) => (
          <div key={date} className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground px-2" data-testid={`date-header-${date}`}>
              {getDateHeader(date, language, t)}
            </h3>
            <div className="space-y-2">
              {dateTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between py-3 px-4 rounded-md border hover-elevate"
            data-testid={`transaction-${transaction.id}`}
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex-1">
                <p className="font-medium">{transaction.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">
                    {/* ⏰ parseISO prevents timezone bugs */}
                    {format(parseISO(transaction.date), "MMM dd, yyyy")}
                  </p>
                  {transaction.category && (
                    <Badge variant="secondary" className="text-xs">
                      {transaction.category}
                    </Badge>
                  )}
                  {transaction.source !== "manual" && (
                    <Badge variant="outline" className="text-xs">
                      {transaction.source}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  "font-mono font-semibold text-lg",
                  transaction.type === "income" 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                )}
                data-testid={`amount-${transaction.id}`}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {transaction.originalAmount && transaction.originalCurrency 
                    ? `${transaction.originalCurrency === "RUB" ? "₽" : transaction.originalCurrency === "IDR" ? "Rp" : "$"}${transaction.originalAmount}`
                    : `$${transaction.amountUsd}`
                  }
                </div>
                {transaction.originalAmount && transaction.originalCurrency && transaction.originalCurrency !== "USD" && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    ≈ ${transaction.amountUsd}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {showEdit && onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(transaction)}
                  data-testid={`button-edit-${transaction.id}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {showDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(transaction.id)}
                  data-testid={`button-delete-${transaction.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
