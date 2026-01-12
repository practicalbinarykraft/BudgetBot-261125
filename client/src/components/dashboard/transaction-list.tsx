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

// System categories that have translations
const SYSTEM_CATEGORIES = ['Unaccounted', 'Salary', 'Freelance', 'Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Healthcare', 'Education', 'Housing', 'Travel', 'Other'];

// Helper to translate category name
function translateCategory(category: string, t: (key: string) => string): string {
  if (SYSTEM_CATEGORIES.includes(category)) {
    return t(`categories.name.${category}`);
  }
  return category;
}

// Helper to translate source
function translateSource(source: string, t: (key: string) => string): string {
  const key = `transaction.source.${source}`;
  const translated = t(key);
  return translated !== key ? translated : source;
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
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 px-3 sm:px-4 rounded-md border hover-elevate gap-2"
            data-testid={`transaction-${transaction.id}`}
          >
            {/* Main content - full width on mobile, flex on desktop */}
            <div className="flex-1 min-w-0">
              {/* Description and Amount row */}
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm sm:text-base truncate flex-1">{transaction.description}</p>
                {/* Amount - always visible, right aligned */}
                <div className="text-right shrink-0">
                  <div className={cn(
                    "font-mono font-semibold text-base sm:text-lg whitespace-nowrap",
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
                    <div className="text-xs text-muted-foreground">
                      ≈ ${transaction.amountUsd}
                    </div>
                  )}
                </div>
              </div>
              {/* Meta info row */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {format(parseISO(transaction.date), "d MMM", { locale: language === 'ru' ? ru : enUS })}
                </p>
                {transaction.category && (
                  <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2">
                    {translateCategory(transaction.category, t)}
                  </Badge>
                )}
                {transaction.source !== "manual" && (
                  <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 py-0.5 sm:px-2 hidden sm:inline-flex">
                    {translateSource(transaction.source || 'manual', t)}
                  </Badge>
                )}
              </div>
            </div>
            {/* Action buttons - full width on mobile, compact on desktop */}
            <div className="flex gap-1 sm:gap-1 w-full sm:w-auto sm:shrink-0">
              {showEdit && onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 sm:flex-none h-8 sm:h-9 sm:w-9 sm:px-0"
                  onClick={() => onEdit(transaction)}
                  data-testid={`button-edit-${transaction.id}`}
                >
                  <Pencil className="h-4 w-4 sm:mr-0" />
                  <span className="sm:hidden ml-2">{t("common.edit")}</span>
                </Button>
              )}
              {showDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 sm:flex-none h-8 sm:h-9 sm:w-9 sm:px-0"
                  onClick={() => onDelete(transaction.id)}
                  data-testid={`button-delete-${transaction.id}`}
                >
                  <Trash2 className="h-4 w-4 sm:mr-0" />
                  <span className="sm:hidden ml-2">{t("common.delete")}</span>
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
