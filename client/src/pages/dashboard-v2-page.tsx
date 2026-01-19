/**
 * Dashboard V2 - Simplified Mobile UI
 * 
 * Experimental page with simplified mobile interface based on competitor analysis.
 * Available at /app/dashboard-v2 route.
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { 
  Wallet, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  ArrowDown,
  ArrowUp,
  Plus,
  Mic,
  MessageCircle,
  Menu as MenuIcon
} from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "@/i18n";
import { getCurrencySymbol, convertFromUSD } from "@/lib/currency-utils";
import { Transaction, Category, Budget } from "@shared/schema";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog";
import { useChatSidebar } from "@/stores/chat-sidebar-store";
import { VoiceRecorderAdaptive, ParsedVoiceResult } from "@/components/voice-recorder-adaptive";
import { useTelegramSafeArea } from "@/hooks/use-telegram-safe-area";
import { useTranslateCategory } from "@/lib/category-translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { calculateBudgetProgress, getBudgetPeriodDates } from "@/lib/budget-helpers";
import { parseISO } from "date-fns";
import { useTheme } from "@/hooks/use-theme";

export default function DashboardV2Page() {
  const { t, language } = useTranslation();
  // useTheme hook автоматически применяет темную тему только для Dashboard V2
  const translateCategory = useTranslateCategory();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [interimTranscription, setInterimTranscription] = useState(""); // Промежуточная транскрипция для показа в реальном времени
  const [isVoiceRecording, setIsVoiceRecording] = useState(false); // Состояние записи голоса
  const [voiceData, setVoiceData] = useState<{
    description?: string;
    amount?: string;
    currency?: string;
    category?: string;
    type?: 'income' | 'expense';
  }>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [transactionForCategory, setTransactionForCategory] = useState<Transaction | null>(null);
  const { open: openAiChat } = useChatSidebar();
  const safeArea = useTelegramSafeArea();

  // Calculate date range for selected month
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const fromDate = monthStart.toISOString().split('T')[0];
  const toDate = monthEnd.toISOString().split('T')[0];

  // Fetch user settings for currency
  const { data: settings } = useQuery<{
    currency?: string;
    exchangeRateRUB?: string;
    exchangeRateIDR?: string;
    exchangeRateKRW?: string;
    exchangeRateEUR?: string;
    exchangeRateCNY?: string;
  }>({
    queryKey: ['/api/settings'],
  });

  const currency = settings?.currency || 'USD';
  
  // Get exchange rate for user's currency
  const exchangeRate = currency === 'USD' ? 1 :
    currency === 'RUB' ? parseFloat(settings?.exchangeRateRUB || '92.5') :
    currency === 'IDR' ? parseFloat(settings?.exchangeRateIDR || '15750') :
    currency === 'KRW' ? parseFloat(settings?.exchangeRateKRW || '1320') :
    currency === 'EUR' ? parseFloat(settings?.exchangeRateEUR || '0.92') :
    currency === 'CNY' ? parseFloat(settings?.exchangeRateCNY || '7.24') : 1;

  const currencySymbol = getCurrencySymbol(currency);

  // Format currency amount
  const formatCurrency = (usdAmount: number): string => {
    const amountInCurrency = convertFromUSD(usdAmount, currency, exchangeRate);
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amountInCurrency);
  };

  // Fetch wallets for total balance
  const { data: wallets } = useQuery<Array<{
    id: number;
    name: string;
    balanceUsd: string;
  }>>({
    queryKey: ['/api/wallets'],
  });

  const totalBalanceUsd = wallets?.reduce((sum, w) => 
    sum + parseFloat(w.balanceUsd || '0'), 0) || 0;

  // Fetch stats for selected month
  const { data: stats } = useQuery<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
  }>({
    queryKey: ['/api/stats', fromDate, toDate],
    queryFn: async () => {
      const res = await fetch(`/api/stats?from=${fromDate}&to=${toDate}`);
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });

  // Fetch category breakdown for top categories
  // Note: API uses period parameter, but we can calculate period from dates
  const { data: categoryBreakdown } = useQuery<{
    total: number;
    items: Array<{
      id: number;
      name: string;
      icon: string;
      color: string;
      amount: number;
      percentage: number;
    }>;
  }>({
    queryKey: ['/api/analytics/by-category', fromDate, toDate],
    queryFn: async () => {
      // Calculate period from dates (month, week, year, or custom)
      const daysDiff = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
      let period = 'month';
      if (daysDiff <= 7) period = 'week';
      else if (daysDiff >= 365) period = 'year';
      
      const res = await fetch(`/api/analytics/by-category?period=${period}`);
      if (!res.ok) throw new Error("Failed to fetch category breakdown");
      return res.json();
    },
  });

  // Fetch recent transactions (limit 5)
  const { data: transactionsResponse } = useQuery<{
    data: Transaction[];
    pagination: { total: number; limit: number; offset: number };
  }>({
    queryKey: ['/api/transactions', fromDate, toDate, 5],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?from=${fromDate}&to=${toDate}&limit=5`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  // Fetch all transactions for budget calculations (need wider date range for budgets)
  // Budgets can be for week/month/year, so we need to fetch transactions for the entire budget period
  const { data: allTransactionsResponse } = useQuery<{
    data: Transaction[];
    pagination: { total: number; limit: number; offset: number };
  }>({
    queryKey: ['/api/transactions', 'all'],
    queryFn: async () => {
      // Fetch transactions for the last year to cover all possible budget periods
      const yearStart = new Date(selectedMonth.getFullYear(), 0, 1);
      const yearEnd = new Date(selectedMonth.getFullYear(), 11, 31);
      const res = await fetch(`/api/transactions?from=${yearStart.toISOString().split('T')[0]}&to=${yearEnd.toISOString().split('T')[0]}`);
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    },
  });

  const allTransactions = allTransactionsResponse?.data || [];

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch budgets
  const { data: budgets = [] } = useQuery<Budget[]>({
    queryKey: ['/api/budgets'],
  });

  const recentTransactions = transactionsResponse?.data || [];
  const topCategories = categoryBreakdown?.items.slice(0, 3) || [];


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
    const progress = calculateBudgetProgress(budget, allTransactions, category.name);
    return progress.spent;
  };

  // Handle transaction click
  const handleTransactionClick = (transaction: Transaction) => {
    const category = getCategoryForTransaction(transaction);
    if (!category) {
      // No category - show category selection
      setTransactionForCategory(transaction);
      setShowCategorySelect(true);
    } else {
      // Has category - show edit dialog
      setSelectedTransaction(transaction);
    }
  };

  // Handler для промежуточных результатов (транскрипция в реальном времени)
  const handleInterimResult = (fullText: string) => {
    setInterimTranscription(fullText);
    setIsVoiceRecording(true); // Устанавливаем флаг записи
  };

  // Handler for Web Speech API (plain text) - used in regular browsers
  const handleVoiceResult = (text: string) => {
    // НЕ закрываем модал и не открываем диалог, если текст пустой
    // Это предотвращает закрытие модала при ошибках или пустых результатах
    if (!text || text.trim().length === 0) {
      console.warn('Empty text received, ignoring');
      return;
    }
    
    setVoiceData({ description: text });
    setInterimTranscription(""); // Очищаем промежуточную транскрипцию
    setIsVoiceRecording(false); // Сбрасываем флаг записи
    setShowAddDialog(true);
    setShowVoiceInput(false);
  };

  // Handler for server-side parsed result - used in Telegram Mini App
  const handleVoiceParsedResult = (result: ParsedVoiceResult) => {
    setVoiceData({
      description: result.parsed.description,
      amount: result.parsed.amount,
      currency: result.parsed.currency,
      category: result.parsed.category,
      type: result.parsed.type,
    });
    setInterimTranscription(""); // Очищаем промежуточную транскрипцию
    setIsVoiceRecording(false); // Сбрасываем флаг записи
    setShowAddDialog(true);
    setShowVoiceInput(false);
  };

  // Safety check for safeArea
  const safeAreaBottom = safeArea?.bottom ?? 0;

  return (
    <div className="min-h-screen bg-background pb-32" style={{ paddingBottom: `calc(6rem + ${safeAreaBottom}px)` }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link href="/app/wallets" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Wallet className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {formatCurrency(totalBalanceUsd)}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/app/dashboard">
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
              aria-label={language === 'ru' ? 'Панель управления' : 'Dashboard'}
            >
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </button>
          </Link>
          <button
            onClick={() => setShowMobileMenu(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
            aria-label={language === 'ru' ? 'Меню' : 'Menu'}
          >
            <MenuIcon className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 py-4">
        <button 
          onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
          className="p-2 hover:bg-accent rounded-full transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {format(selectedMonth, 'LLLL yyyy', { locale: language === 'ru' ? ru : undefined })}
        </h2>
        <button 
          onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
          className="p-2 hover:bg-accent rounded-full transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Large Balance */}
      <div className="text-center py-6">
        <div className="text-4xl font-bold">
          {formatCurrency(stats?.balance || 0)}
        </div>
      </div>

      {/* Income/Expense Buttons */}
      <div className="flex gap-3 px-4 mb-6">
        <button className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 text-green-600 rounded-full py-2">
          <ArrowDown className="h-4 w-4" />
          <span className="font-medium">
            {formatCurrency(stats?.totalExpense || 0)}
          </span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 text-red-600 rounded-full py-2">
          <ArrowUp className="h-4 w-4" />
          <span className="font-medium">
            {formatCurrency(stats?.totalIncome || 0)}
          </span>
        </button>
      </div>

      {/* Categories */}
      <div className="px-4 mb-6">
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {topCategories.map((cat) => {
            // Display icon: if it's an emoji (not a Lucide icon name), show it directly
            const iconDisplay = cat.icon && !cat.icon.match(/^[A-Z][a-zA-Z]*$/) 
              ? cat.icon 
              : '🍔'; // Default emoji if icon is a Lucide name or missing
            
            // Find category and budget
            const category = categories.find(c => c.id === cat.id);
            const budget = getBudgetForCategory(cat.id);
            
            // Calculate spent amount for budget
            let spent = cat.amount;
            let limitAmount = 0;
            if (budget && category) {
              spent = getBudgetSpent(budget, category);
              limitAmount = parseFloat(budget.limitAmount);
            }
            
            return (
              <div key={cat.id} className="flex-shrink-0 text-center">
                <div 
                  className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <span className="text-2xl">{iconDisplay}</span>
                </div>
                <div className="text-xs font-medium">{translateCategory(cat.name)}</div>
                <div className="text-xs text-muted-foreground">
                  {budget ? (
                    <span>
                      {Math.round(spent)}{currencySymbol}/{Math.round(limitAmount)}{currencySymbol}
                    </span>
                  ) : (
                    formatCurrency(cat.amount)
                  )}
                </div>
              </div>
            );
          })}
          {topCategories.length > 0 && (
            <div className="flex-shrink-0 flex items-center">
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">
            {language === 'ru' ? 'Недавние' : 'Recent'}
          </h3>
          <Link href="/app/transactions">
            <button className="text-sm text-blue-500 hover:underline">
              {language === 'ru' ? 'Все транзакции >' : 'All transactions >'}
            </button>
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {language === 'ru' ? 'Транзакций еще не было' : 'No transactions yet'}
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((transaction) => {
              const amount = parseFloat(transaction.amountUsd || '0');
              const isExpense = transaction.type === 'expense';
              const displayAmount = formatCurrency(Math.abs(amount));
              const category = getCategoryForTransaction(transaction);
              const budget = getBudgetForCategory(category?.id);
              const categoryName = category ? translateCategory(category.name) : (transaction.category || (language === 'ru' ? 'Без категории' : 'No category'));
              
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
                  onClick={() => handleTransactionClick(transaction)}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{transaction.description}</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>
                        {format(new Date(transaction.date), 'd MMM yyyy', { 
                          locale: language === 'ru' ? ru : undefined 
                        })}
                      </div>
                      {category && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${category.color || '#3b82f6'}20`,
                              color: category.color || '#3b82f6'
                            }}
                          >
                            {categoryName}
                          </span>
                          {budget && (
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
                      )}
                      {!category && (
                        <div className="text-blue-500 text-xs">
                          {language === 'ru' ? 'Нажмите, чтобы выбрать категорию' : 'Tap to select category'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`font-semibold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                    {isExpense ? '-' : '+'}{displayAmount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Action Buttons - Floating overlay, no background */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-4 pointer-events-none z-50"
        style={{ 
          paddingBottom: `calc(1rem + ${safeAreaBottom}px)`,
        }}
      >
        {/* Add Transaction Button */}
        <button
          onClick={() => setShowAddDialog(true)}
          className="w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors pointer-events-auto"
          aria-label={language === 'ru' ? 'Добавить транзакцию' : 'Add transaction'}
        >
          <Plus className="h-5 w-5" />
        </button>

        {/* Microphone Button - Large, centered */}
        <button
          onClick={() => setShowVoiceInput(true)}
          className="w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors hover:scale-105 pointer-events-auto"
          aria-label={language === 'ru' ? 'Голосовой ввод' : 'Voice input'}
        >
          <Mic className="h-6 w-6" />
        </button>

        {/* AI Chat Button */}
        <button
          onClick={() => openAiChat()}
          className="w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors pointer-events-auto"
          aria-label={language === 'ru' ? 'ИИ чат' : 'AI chat'}
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Menu Sheet */}
      <MobileMenuSheet
        open={showMobileMenu}
        onOpenChange={setShowMobileMenu}
      />

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setVoiceData({}); // Clear voice data when dialog closes
        }}
        defaultDescription={voiceData.description}
        defaultAmount={voiceData.amount}
        defaultCurrency={voiceData.currency}
        defaultCategory={voiceData.category}
        defaultType={voiceData.type}
      />

      {/* Voice Input Dialog/Overlay */}
      {showVoiceInput && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">
              {language === 'ru' ? 'Голосовой ввод' : 'Voice Input'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'ru'
                ? 'Нажмите на микрофон и скажите, например: "Кофе 500 рублей"'
                : 'Tap the microphone and say, for example: "Coffee 5 dollars"'}
            </p>
            
            <div className="flex flex-col items-center gap-4 mb-4">
              <VoiceRecorderAdaptive
                onResult={handleVoiceResult}
                onParsedResult={handleVoiceParsedResult}
                onInterimResult={handleInterimResult}
                onRecordingChange={setIsVoiceRecording}
                className="w-16 h-16"
              />
              
              {/* Показываем транскрипцию в реальном времени (как у конкурентов!) */}
              {/* Показываем поле ВСЕГДА, когда модал открыт */}
              <div className="w-full px-4 py-3 bg-muted rounded-lg border border-border min-h-[80px] flex flex-col justify-center">
                {interimTranscription ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-1">
                      {language === 'ru' ? 'Распознавание...' : 'Transcribing...'}
                    </p>
                    <p className="text-base font-medium break-words text-foreground">
                      {interimTranscription}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    {isVoiceRecording 
                      ? (language === 'ru' ? 'Говорите...' : 'Listening...')
                      : (language === 'ru' ? 'Нажмите на микрофон для начала записи' : 'Tap the microphone to start recording')
                    }
                  </p>
                )}
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowVoiceInput(false);
                setInterimTranscription(""); // Очищаем при закрытии
                setIsVoiceRecording(false); // Сбрасываем флаг записи
              }}
              className="mt-4 w-full py-2 px-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              {language === 'ru' ? 'Отмена' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      {/* Edit Transaction Dialog */}
      {selectedTransaction && (
        <EditTransactionDialog
          transaction={selectedTransaction}
          open={!!selectedTransaction}
          onOpenChange={(open) => {
            if (!open) setSelectedTransaction(null);
          }}
        />
      )}

      {/* Category Selection Dialog */}
      <Dialog open={showCategorySelect} onOpenChange={setShowCategorySelect}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Выберите категорию' : 'Select Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
            {categories
              .filter(cat => cat.type === (transactionForCategory?.type || 'expense'))
              .map((category) => (
                <Button
                  key={category.id}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                  onClick={async () => {
                    if (!transactionForCategory) return;
                    
                    // Update transaction with category
                    try {
                      const res = await fetch(`/api/transactions/${transactionForCategory.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          categoryId: category.id,
                          category: category.name,
                        }),
                      });
                      
                      if (res.ok) {
                        // Invalidate queries to refresh data
                        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
                        setShowCategorySelect(false);
                        setTransactionForCategory(null);
                      }
                    } catch (error) {
                      console.error('Failed to update transaction:', error);
                    }
                  }}
                >
                  <span className="text-2xl">{category.icon || '📁'}</span>
                  <span className="text-xs">{translateCategory(category.name)}</span>
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
