import { Transaction, PersonalTag, Category, Budget } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, User, Heart, Home, Users, Baby, UserPlus, Briefcase, Gift, Dog, Cat } from "lucide-react";
import type { LucideIcon } from "lucide-react";
// ⏰ parseISO prevents timezone bugs when parsing date strings from DB
import { format, parseISO, isToday, isYesterday } from "date-fns";
import { ru, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { useQuery } from "@tanstack/react-query";
import { selectData } from "@/lib/queryClient";
import { useTranslateCategory } from "@/lib/category-translations";
import { calculateBudgetProgress } from "@/lib/budget-helpers";
import { formatTransactionAmount } from "@/lib/currency-utils";

interface TransactionListProps {
  transactions: Transaction[];
  onDelete?: (id: number) => void;
  onEdit?: (transaction: Transaction) => void;
  showDelete?: boolean;
  showEdit?: boolean;
}

// Icon map for tags (same as in dashboard-v2)
const ICON_MAP: Record<string, LucideIcon> = {
  User,
  Heart,
  Home,
  Users,
  Baby,
  UserPlus,
  Briefcase,
  Gift,
  Dog,
  Cat,
};

const DEFAULT_TAG_NAMES = ['Personal', 'Shared'];

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
  const translateCategory = useTranslateCategory();
  
  // Fetch tags for displaying personal tags
  const { data: tags = [] } = useQuery({
    queryKey: ["/api/tags"],
    select: (data: unknown) => selectData<PersonalTag>(data),
  });
  
  // Fetch categories for displaying category names
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    select: (data: unknown) => selectData<Category>(data),
  });
  
  // Fetch budgets for displaying budget limits
  const { data: budgets = [] } = useQuery({
    queryKey: ["/api/budgets"],
    select: (data: unknown) => selectData<Budget>(data),
  });
  
  // Helper to get category for transaction
  const getCategoryForTransaction = (transaction: Transaction): Category | undefined => {
    if (transaction.categoryId) {
      return categories.find(c => c.id === transaction.categoryId);
    }
    if (transaction.category) {
      return categories.find(c => c.name === transaction.category);
    }
    return undefined;
  };
  
  // Helper to get budget for category
  const getBudgetForCategory = (categoryId: number | null | undefined): Budget | undefined => {
    if (!categoryId) return undefined;
    return budgets.find(b => b.categoryId === categoryId);
  };
  
  // Helper to calculate spent amount for budget
  const getBudgetSpent = (budget: Budget, category: Category): number => {
    try {
      if (!budget || !category || !transactions || transactions.length === 0) {
        return 0;
      }
      const progress = calculateBudgetProgress(budget, transactions, category.name);
      return progress.spent;
    } catch (error) {
      console.error('Error calculating budget spent:', error, { budgetId: budget?.id, categoryId: category?.id });
      return 0;
    }
  };
  
  // Format currency amount
  const formatCurrency = (usdAmount: number): string => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(usdAmount);
  };
  
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
              {dateTransactions.map((transaction) => {
                const amount = parseFloat(transaction.amountUsd || '0');
                const isExpense = transaction.type === 'expense';
                const displayAmount = formatCurrency(Math.abs(amount));
                const category = getCategoryForTransaction(transaction);
                const budget = getBudgetForCategory(category?.id);
                const categoryName = category ? translateCategory(category.name) : (transaction.category || (language === 'ru' ? 'Без категории' : 'No category'));
                const personalTag = transaction.personalTagId ? tags.find(t => t.id === transaction.personalTagId) : null;
                
                // Calculate spent amount for budget
                let spent = 0;
                let limitAmount = 0;
                let remaining = 0;
                if (budget && category) {
                  spent = getBudgetSpent(budget, category);
                  limitAmount = parseFloat(budget.limitAmount);
                  remaining = Math.max(0, limitAmount - spent);
                }
                
                return (
                  <div
                    key={transaction.id}
                    onClick={() => onEdit?.(transaction)}
                    className="flex items-start justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                    data-testid={`transaction-${transaction.id}`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{transaction.description}</div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          {format(parseISO(transaction.date), 'd MMM yyyy', {
                            locale: language === 'ru' ? ru : enUS
                          })}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap min-h-[22px]">
                          {/* Tag first */}
                          {personalTag ? (
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium gap-1"
                              style={{ 
                                backgroundColor: `${personalTag.color || '#3b82f6'}20`,
                                color: personalTag.color || '#3b82f6'
                              }}
                            >
                              {(() => {
                                const IconComponent = personalTag.icon && ICON_MAP[personalTag.icon] 
                                  ? ICON_MAP[personalTag.icon] 
                                  : User;
                                const displayName = DEFAULT_TAG_NAMES.includes(personalTag.name)
                                  ? t(`tags.default_name.${personalTag.name}`)
                                  : personalTag.name;
                                return (
                                  <>
                                    <IconComponent className="h-3 w-3 flex-shrink-0" />
                                    <span>{displayName}</span>
                                  </>
                                );
                              })()}
                            </span>
                          ) : null}
                          {/* Category second */}
                          {category ? (
                            <span 
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${category.color || '#3b82f6'}20`,
                                color: category.color || '#3b82f6'
                              }}
                            >
                              {categoryName}
                            </span>
                          ) : null}
                          {/* Budget limit third */}
                          {budget && category && (
                            <span className="text-xs font-medium">
                              {formatCurrency(spent).replace(/\s/g, '')}/{formatCurrency(limitAmount).replace(/\s/g, '')}
                              {remaining > 0 && (
                                <span className="text-muted-foreground ml-1">
                                  ({language === 'ru' ? 'осталось' : 'left'} {formatCurrency(remaining).replace(/\s/g, '')})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className={`font-semibold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                        {isExpense ? '-' : '+'}{displayAmount}
                      </div>
                      {(() => {
                        const currInfo = formatTransactionAmount(transaction);
                        if (currInfo.showConversion) {
                          return (
                            <div className="text-xs text-muted-foreground">
                              {currInfo.mainAmount} {currInfo.mainSymbol}
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
