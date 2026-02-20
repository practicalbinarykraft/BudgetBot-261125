/**
 * Dashboard V2 - Simplified Mobile UI
 * 
 * Experimental page with simplified mobile interface based on competitor analysis.
 * Available at /app/dashboard-v2 route.
 */

import { useState, useMemo } from "react";
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
  Menu as MenuIcon,
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
  Pencil
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "@/i18n";
import { getCurrencySymbol, convertFromUSD } from "@/lib/currency-utils";
import { Transaction, Category, Budget, Notification, PersonalTag } from "@shared/schema";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { EditTransactionDialog } from "@/components/transactions/edit-transaction-dialog";
import { useChatSidebar } from "@/stores/chat-sidebar-store";
import { VoiceRecorderAdaptive, ParsedVoiceResult } from "@/components/voice-recorder-adaptive";
import { useTelegramSafeArea } from "@/hooks/use-telegram-safe-area";
import { useTelegramPaddingTopStyle } from "@/hooks/use-telegram-safe-area";
import { useTranslateCategory } from "@/lib/category-translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CategoryCreateDialog } from "@/components/categories/category-create-dialog";
import { CreateTagDialog } from "@/components/tags/create-tag-dialog";
import { calculateBudgetProgress, getBudgetPeriodDates } from "@/lib/budget-helpers";
import { parseISO } from "date-fns";
import { useTheme } from "@/hooks/use-theme";
import { parseTransactionText, isParseSuccessful } from "@/lib/parse-transaction-text";
import { apiRequest, selectData } from "@/lib/queryClient";
import { CircularProgress } from "@/components/ui/circular-progress";
import { CategorySelectDialog, loadSelectedCategories } from "@/components/dashboard/category-select-dialog";
import { CreditsWidget } from "@/components/credits-widget";
import { NotificationsBell } from "@/components/notifications-bell";
import { TagBadge } from "@/components/tags/tag-badge";

// Icon map for tags (same as in TagBadge component)
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

export default function DashboardV2Page() {
  const { t, language } = useTranslation();
  const [, setLocation] = useLocation();
  // useTheme hook применяет глобальную темную тему
  const translateCategory = useTranslateCategory();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [interimTranscription, setInterimTranscription] = useState(""); // Промежуточная транскрипция для показа в реальном времени
  const [isVoiceRecording, setIsVoiceRecording] = useState(false); // Состояние записи голоса
  const [voiceError, setVoiceError] = useState<string | null>(null); // Ошибка голосового ввода
  const [voiceData, setVoiceData] = useState<{
    description?: string;
    amount?: string;
    currency?: string;
    category?: string;
    type?: 'income' | 'expense';
  }>({});
  const [notificationData, setNotificationData] = useState<{
    description?: string;
    amount?: string;
    currency?: string;
    category?: string;
    type?: 'income' | 'expense';
    date?: string;
    categoryId?: number;
  }>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showCategorySelect, setShowCategorySelect] = useState(false);
  const [transactionForCategory, setTransactionForCategory] = useState<Transaction | null>(null);
  const [showCreateCategory, setShowCreateCategory] = useState(false);
  const [showCategorySelectDialog, setShowCategorySelectDialog] = useState(false);
  const [showTagSelect, setShowTagSelect] = useState(false);
  const [transactionForTag, setTransactionForTag] = useState<Transaction | null>(null);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [editingTag, setEditingTag] = useState<PersonalTag | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(() => {
    // Load from localStorage on mount (only in browser)
    if (typeof window !== 'undefined') {
      try {
        return loadSelectedCategories();
      } catch (error) {
        console.error('Failed to load selected categories:', error);
        return [];
      }
    }
    return [];
  });
  const { open: openAiChat, isOpen: isChatOpen } = useChatSidebar();
  const safeArea = useTelegramSafeArea();
  const telegramPaddingStyle = useTelegramPaddingTopStyle();

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
  const { data: walletsResponse } = useQuery<{ data: Array<{
    id: number;
    name: string;
    balanceUsd: string;
  }>; pagination: unknown }>({
    queryKey: ['/api/wallets'],
  });

  const wallets = walletsResponse?.data;
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
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    select: (data: unknown) => selectData<Category>(data),
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['/api/tags'],
    select: (data: unknown) => selectData<PersonalTag>(data),
  });

  // Fetch budgets
  const { data: budgets = [] } = useQuery({
    queryKey: ['/api/budgets'],
    select: (data: unknown) => selectData<Budget>(data),
  });

  const recentTransactions = transactionsResponse?.data || [];
  
  // Filter categories based on user selection
  // If no categories selected, show top 3 by default
  let topCategories = categoryBreakdown?.items || [];
  if (selectedCategoryIds.length > 0) {
    // Load order from localStorage (only in browser)
    let categoryOrder: number[] = [];
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dashboard-v2-categories-order');
        if (saved) {
          categoryOrder = JSON.parse(saved);
        }
      } catch (error) {
        console.error('Failed to load category order:', error);
      }
    }
    
    // Filter to only selected categories
    const selectedSet = new Set(selectedCategoryIds);
    const filtered = topCategories.filter((cat) => selectedSet.has(cat.id));
    
    // Sort by order if available
    if (categoryOrder.length > 0) {
      topCategories = filtered.sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a.id);
        const bIndex = categoryOrder.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    } else {
      topCategories = filtered;
    }
  } else {
    // Default: show top 3
    topCategories = topCategories.slice(0, 3);
  }


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
      if (!budget || !category || !allTransactions || allTransactions.length === 0) {
        return 0;
      }
      const progress = calculateBudgetProgress(budget, allTransactions, category.name);
      return progress.spent;
    } catch (error) {
      console.error('Error calculating budget spent:', error, { budgetId: budget?.id, categoryId: category?.id });
      return 0;
    }
  };

  // Handle transaction click
  const handleTransactionClick = (transaction: Transaction) => {
    const category = getCategoryForTransaction(transaction);
    const personalTag = transaction.personalTagId ? tags.find(t => t.id === transaction.personalTagId) : null;
    
    if (!category) {
      // No category - show category selection
      setTransactionForCategory(transaction);
      setShowCategorySelect(true);
    } else if (!personalTag) {
      // Has category but no tag - show tag selection
      setTransactionForTag(transaction);
      setShowTagSelect(true);
    } else {
      // Has category and tag - show edit dialog
      setSelectedTransaction(transaction);
    }
  };
  
  // Handle transaction hover/right-click for tag selection (when category exists but tag doesn't)
  const handleTransactionTagAction = (e: React.MouseEvent, transaction: Transaction) => {
    e.stopPropagation(); // Prevent triggering handleTransactionClick
    const category = getCategoryForTransaction(transaction);
    const personalTag = transaction.personalTagId ? tags.find(t => t.id === transaction.personalTagId) : null;
    
    if (category && !personalTag) {
      setTransactionForTag(transaction);
      setShowTagSelect(true);
    }
  };

  // Handler для промежуточных результатов (транскрипция в реальном времени)
  const handleInterimResult = (fullText: string) => {
    setInterimTranscription(fullText);
    setIsVoiceRecording(true); // Устанавливаем флаг записи
  };

  // Handler for Web Speech API (plain text) - used in regular browsers
  // Uses combined parsing: local first, then AI fallback
  const handleVoiceResult = async (text: string) => {
    // НЕ закрываем модал и не открываем диалог, если текст пустой
    if (!text || text.trim().length === 0) {
      return;
    }

    // Step 1: Try local parsing first (instant, free)
    const localParsed = parseTransactionText(text);

    // Step 2: If local parsing got amount - use it
    if (isParseSuccessful(localParsed)) {
      setVoiceData({
        description: localParsed.description,
        amount: localParsed.amount?.toString(),
        currency: localParsed.currency || undefined,
        category: localParsed.category || undefined,
        type: localParsed.type,
      });
      setInterimTranscription("");
      setIsVoiceRecording(false);
      setShowAddDialog(true);
      setShowVoiceInput(false);
      return;
    }

    // Step 3: Local parsing failed - try AI parsing (fallback)
    try {
      const response = await apiRequest('POST', '/api/ai/parse-text', { text });
      const data = await response.json();

      if (data.success && data.parsed) {
        setVoiceData({
          description: data.parsed.description,
          amount: data.parsed.amount,
          currency: data.parsed.currency,
          category: data.parsed.category,
          type: data.parsed.type,
        });
      } else {
        // AI also failed - use local result as best effort
        setVoiceData({
          description: localParsed.description,
          amount: localParsed.amount?.toString(),
          currency: localParsed.currency || undefined,
          category: localParsed.category || undefined,
          type: localParsed.type,
        });
      }
    } catch (error) {
      // Network error or API error - use local result
      setVoiceData({
        description: localParsed.description,
        amount: localParsed.amount?.toString(),
        currency: localParsed.currency || undefined,
        category: localParsed.category || undefined,
        type: localParsed.type,
      });
    }

    setInterimTranscription("");
    setIsVoiceRecording(false);
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
      <div 
        className="flex items-center justify-between p-3 sm:p-4 relative h-[72px] sm:h-[80px]"
        style={telegramPaddingStyle}
      >
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Placeholder for SidebarTrigger on desktop to match App.tsx header width */}
          <div className="hidden sm:flex flex-shrink-0 w-7 h-7" />
          <Link href="/app/wallets" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
            <Wallet className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">
              {formatCurrency(totalBalanceUsd)}
            </span>
          </Link>
          <div className="flex-shrink-0">
            <NotificationsBell
            onNotificationClick={(notification: Notification) => {
              console.log('[Dashboard-v2] onNotificationClick received', {
                notificationId: notification.id,
                transactionData: notification.transactionData,
              });
              // Extract transaction data from notification
              const transactionData = notification.transactionData as any;
              const newNotificationData = {
                description: transactionData?.description || notification.message,
                amount: transactionData?.amount?.toString(),
                currency: transactionData?.currency,
                category: transactionData?.category,
                type: transactionData?.type,
                date: transactionData?.date,
                categoryId: transactionData?.categoryId,
              };
              console.log('[Dashboard-v2] Setting notificationData:', newNotificationData);
              setNotificationData(newNotificationData);
              console.log('[Dashboard-v2] Setting showAddDialog to true');
              setShowAddDialog(true);
            }}
          />
          </div>
        </div>
        {/* CreditsWidget - абсолютно по центру, чтобы не скакал при переключении страниц */}
        <div className="absolute left-1/2 transform -translate-x-1/2 h-8 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto">
            <CreditsWidget />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
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
      <div className="flex items-center justify-center gap-4 py-4 mb-8">
        <button 
          onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
          className="p-2 bg-muted/30 hover:bg-accent/60 rounded-full transition-all duration-200 hover:shadow-md"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">
          {format(selectedMonth, 'LLLL yyyy', { locale: language === 'ru' ? ru : undefined })}
        </h2>
        <button 
          onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
          className="p-2 bg-muted/30 hover:bg-accent/60 rounded-full transition-all duration-200 hover:shadow-md"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Large Balance */}
      <div className="text-center mb-8">
        <div className="text-4xl font-bold">
          {formatCurrency(stats?.balance || 0)}
        </div>
      </div>

      {/* Income/Expense Buttons */}
      <div className="flex gap-3 px-4 mb-6">
        <button 
          onClick={() => {
            const params = new URLSearchParams();
            params.append('type', 'income');
            params.append('from', fromDate);
            params.append('to', toDate);
            setLocation(`/app/transactions?${params.toString()}`);
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500/20 dark:bg-green-500/10 text-green-700 dark:text-green-600 border border-green-500/30 dark:border-transparent rounded-full py-2 shadow-[0_0_20px_rgba(34,197,94,0.09),0_0_15px_rgba(34,197,94,0.075),inset_0_0_10px_rgba(34,197,94,0.03)] hover:shadow-[0_0_25px_rgba(34,197,94,0.15),inset_0_0_15px_rgba(34,197,94,0.045)] transition-shadow duration-300 cursor-pointer"
        >
          <ArrowUp className="h-4 w-4" />
          <span className="font-medium">
            {formatCurrency(stats?.totalIncome || 0)}
          </span>
        </button>
        <button 
          onClick={() => {
            const params = new URLSearchParams();
            params.append('type', 'expense');
            params.append('from', fromDate);
            params.append('to', toDate);
            setLocation(`/app/transactions?${params.toString()}`);
          }}
          className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 dark:bg-red-500/10 text-red-700 dark:text-red-600 border border-red-500/30 dark:border-transparent rounded-full py-2 shadow-[0_0_20px_rgba(239,68,68,0.09),0_0_15px_rgba(239,68,68,0.075),inset_0_0_10px_rgba(239,68,68,0.03)] hover:shadow-[0_0_25px_rgba(239,68,68,0.15),inset_0_0_15px_rgba(239,68,68,0.045)] transition-shadow duration-300 cursor-pointer"
        >
          <ArrowDown className="h-4 w-4" />
          <span className="font-medium">
            {formatCurrency(stats?.totalExpense || 0)}
          </span>
        </button>
      </div>

      {/* Categories */}
      <div className="px-4 mb-6">
        <div 
          className={`flex gap-6 pb-2 scrollbar-hide ${
            topCategories.length >= 5 
              ? 'overflow-x-auto touch-pan-x' 
              : 'overflow-x-auto'
          }`}
          style={{
            WebkitOverflowScrolling: topCategories.length >= 5 ? 'touch' : 'auto',
            scrollBehavior: 'smooth',
            touchAction: topCategories.length >= 5 ? 'pan-x' : 'auto',
          }}
        >
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
            let progress = 0;
            if (budget && category) {
              spent = getBudgetSpent(budget, category);
              limitAmount = parseFloat(budget.limitAmount);
              // Calculate progress (0-1), cap at 1.0 (100%)
              progress = limitAmount > 0 ? Math.min(spent / limitAmount, 1.0) : 0;
            } else {
              // If no budget, calculate progress relative to max category amount
              const maxAmount = Math.max(...topCategories.map(c => c.amount), 1);
              progress = cat.amount / maxAmount;
            }
            
            // Determine color based on progress
            const progressColor = budget && limitAmount > 0
              ? progress >= 1.0 
                ? '#ef4444' // Red when over budget
                : progress >= 0.8
                ? '#f59e0b' // Orange when close to limit
                : cat.color || '#3b82f6' // Category color or blue
              : cat.color || '#3b82f6';
            
            return (
              <div 
                key={cat.id} 
                className="flex-shrink-0 text-center cursor-pointer hover:opacity-80 transition-opacity" 
                style={{ minWidth: '80px' }}
                onClick={() => {
                  // Перенаправляем на страницу транзакций с фильтром по категории
                  setLocation(`/app/transactions?categoryId=${cat.id}`);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLocation(`/app/transactions?categoryId=${cat.id}`);
                  }
                }}
                aria-label={`${translateCategory(cat.name)} - ${formatCurrency(cat.amount)}`}
              >
                <div className="flex justify-center mb-2">
                  <CircularProgress
                    progress={progress}
                    size={64}
                    strokeWidth={4}
                    color={progressColor}
                    backgroundColor="rgba(0, 0, 0, 0.1)"
                    className="dark:bg-background"
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color || '#3b82f6'}20` }}
                    >
                      <span className="text-2xl">{iconDisplay}</span>
                    </div>
                  </CircularProgress>
                </div>
                <div className="text-xs font-medium mb-1">{translateCategory(cat.name)}</div>
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
          <div 
            className="flex-shrink-0 flex items-center min-w-[24px] cursor-pointer hover:bg-muted/50 rounded-lg p-1 transition-colors"
            onClick={() => setShowCategorySelectDialog(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowCategorySelectDialog(true);
              }
            }}
            aria-label={t('dashboard.select_categories_aria')}
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
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
                  onClick={() => handleTransactionClick(transaction)}
                  onContextMenu={(e) => {
                    const category = getCategoryForTransaction(transaction);
                    const personalTag = transaction.personalTagId ? tags.find(t => t.id === transaction.personalTagId) : null;
                    if (category && !personalTag) {
                      e.preventDefault();
                      handleTransactionTagAction(e, transaction);
                    }
                  }}
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
                      <div className="flex items-center gap-2 flex-wrap">
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
                        ) : (
                          <button
                            onClick={(e) => handleTransactionTagAction(e, transaction)}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              handleTransactionTagAction(e, transaction);
                            }}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-blue-500/50 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer"
                            title={t("transactions.add_tag_hint")}
                          >
                            {language === 'ru' ? 'Тег' : 'Tag'}+
                          </button>
                        )}
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
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTransactionForCategory(transaction);
                              setShowCategorySelect(true);
                            }}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-blue-500/50 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer"
                          >
                            {language === 'ru' ? 'Категория' : 'Category'}+
                          </button>
                        )}
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
      {/* Скрываем кнопки когда чат открыт */}
      {!isChatOpen && (
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
        style={{ 
          paddingBottom: `${safeAreaBottom}px`,
        }}
      >
        {/* Cross layout container */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Home Button - Left */}
          <Link href="/app/dashboard-v2">
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors pointer-events-auto"
              aria-label={language === 'ru' ? 'Главная' : 'Home'}
            >
              <Home className="h-5 w-5" />
            </button>
          </Link>

          {/* Microphone Button - Top, centered */}
          <button
            onClick={() => setShowVoiceInput(true)}
            className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors hover:scale-105 pointer-events-auto"
            aria-label={language === 'ru' ? 'Голосовой ввод' : 'Voice input'}
          >
            <Mic className="h-6 w-6" />
          </button>

          {/* Add Transaction Button - Bottom, centered */}
          <button
            onClick={() => setShowAddDialog(true)}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors pointer-events-auto"
            aria-label={language === 'ru' ? 'Добавить транзакцию' : 'Add transaction'}
          >
            <Plus className="h-5 w-5" />
          </button>

          {/* AI Chat Button - Right */}
          <button
            onClick={() => openAiChat()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors pointer-events-auto"
            aria-label={language === 'ru' ? 'ИИ чат' : 'AI chat'}
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      </div>
      )}

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
          if (!open) {
            setVoiceData({}); // Clear voice data when dialog closes
            setNotificationData({}); // Clear notification data when dialog closes
          }
        }}
        defaultDescription={notificationData?.description || voiceData.description}
        defaultAmount={notificationData?.amount || voiceData.amount}
        defaultCurrency={notificationData?.currency || voiceData.currency}
        defaultCategory={notificationData?.category || voiceData.category}
        defaultType={notificationData?.type || voiceData.type}
        defaultDate={notificationData?.date}
        defaultCategoryId={notificationData?.categoryId}
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
                onError={setVoiceError}
                className="w-16 h-16"
              />
              
              {/* Показываем ошибку, если есть */}
              {voiceError && (
                <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    {voiceError}
                  </p>
                </div>
              )}
              
              {/* Показываем транскрипцию в реальном времени (как у конкурентов!) */}
              {/* Показываем поле ВСЕГДА, когда модал открыт */}
              {!voiceError && (
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
              )}
            </div>
            
            <button
              onClick={() => {
                setShowVoiceInput(false);
                setInterimTranscription(""); // Очищаем при закрытии
                setIsVoiceRecording(false); // Сбрасываем флаг записи
                setVoiceError(null); // Очищаем ошибку при закрытии
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
        <DialogContent className="flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {language === 'ru' ? 'Выберите категорию' : 'Select Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2">
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
                      // Ignore update errors
                    }
                  }}
                >
                  <span className="text-2xl">{category.icon && category.icon !== 'Tag' ? category.icon : '📁'}</span>
                  <span className="text-xs">{translateCategory(category.name)}</span>
                </Button>
              ))}
          </div>
          <div className="border-t pt-4 mt-4">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => {
                setShowCategorySelect(false);
                setShowCreateCategory(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {language === 'ru' ? 'Добавить категорию' : 'Add Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Select Dialog */}
      <CategorySelectDialog
        open={showCategorySelectDialog}
        onOpenChange={setShowCategorySelectDialog}
        categories={categories}
        selectedCategoryIds={selectedCategoryIds}
        onSelectionChange={setSelectedCategoryIds}
        categoryBreakdown={categoryBreakdown?.items || []}
        budgets={budgets}
        budgetSpentMap={useMemo(() => {
          if (!categories.length || !allTransactions.length) {
            return new Map<number, number>();
          }
          try {
            return new Map(
              categories.map(cat => {
                try {
                  const budget = budgets.find(b => b.categoryId === cat.id);
                  if (budget && cat) {
                    const progress = calculateBudgetProgress(budget, allTransactions, cat.name);
                    return [cat.id, progress.spent];
                  }
                  return [cat.id, 0];
                } catch (error) {
                  console.error(`Error calculating budget spent for category ${cat.id}:`, error);
                  return [cat.id, 0];
                }
              })
            );
          } catch (error) {
            console.error('Error creating budgetSpentMap:', error);
            return new Map<number, number>();
          }
        }, [categories, budgets, allTransactions])}
        currencySymbol={currencySymbol}
        formatCurrency={(amount: number) => Math.round(amount).toString()}
      />

      {/* Category Create Dialog */}
      <CategoryCreateDialog
        open={showCreateCategory}
        onOpenChange={setShowCreateCategory}
        defaultType={(transactionForCategory?.type as 'income' | 'expense') || 'expense'}
        onSuccess={(categoryName) => {
          // After creating category, refresh categories and reopen selection dialog
          queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
          setShowCreateCategory(false);
          setShowCategorySelect(true);
        }}
      />

      {/* Tag Selection Dialog */}
      <Dialog open={showTagSelect} onOpenChange={setShowTagSelect}>
        <DialogContent className="flex flex-col max-w-md">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {t("transactions.select_tag")}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col">
            {tags.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                {t("tags.no_tags_available")}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="relative group">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center gap-2 h-auto py-4 w-full min-w-0 overflow-visible relative"
                      onClick={async () => {
                        if (!transactionForTag) return;
                        
                        // Update transaction with tag
                        try {
                          const res = await fetch(`/api/transactions/${transactionForTag.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              personalTagId: tag.id,
                            }),
                          });
                          
                          if (res.ok) {
                            // Invalidate queries to refresh data
                            queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
                            setShowTagSelect(false);
                            setTransactionForTag(null);
                          }
                        } catch (error) {
                          // Ignore update errors
                        }
                      }}
                    >
                      <div className="flex items-center gap-1 justify-center w-full min-w-0 relative z-0">
                        {(() => {
                          const IconComponent = tag.icon && ICON_MAP[tag.icon] 
                            ? ICON_MAP[tag.icon] 
                            : User;
                          const displayName = DEFAULT_TAG_NAMES.includes(tag.name)
                            ? t(`tags.default_name.${tag.name}`)
                            : tag.name;
                          return (
                            <>
                              <IconComponent className="h-4 w-4 flex-shrink-0" style={{ color: tag.color || '#3b82f6' }} />
                              <span className="text-sm font-medium truncate" style={{ color: tag.color || '#3b82f6' }}>
                                {displayName}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-0.5 right-0.5 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 hover:bg-background z-20 p-0 m-0 min-w-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setEditingTag(tag);
                          setShowTagSelect(false);
                          setShowCreateTag(true);
                        }}
                        title={language === 'ru' ? 'Редактировать тег' : 'Edit tag'}
                      >
                        <Pencil className="h-1.5 w-1.5" />
                      </Button>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t pt-4 mt-4 flex-shrink-0">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => {
                setShowTagSelect(false);
                setShowCreateTag(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {t("tags.add_tag")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tag Create/Edit Dialog */}
      <CreateTagDialog
        open={showCreateTag}
        editTag={editingTag}
        onDelete={async (tagId: number) => {
          try {
            await apiRequest('DELETE', `/api/tags/${tagId}`);
            queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
            queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
            setShowCreateTag(false);
            setEditingTag(null);
            // Small delay to ensure tags are refreshed before reopening dialog
            setTimeout(() => {
              if (transactionForTag) {
                setShowTagSelect(true);
              }
            }, 100);
          } catch (error: any) {
            // Error will be shown via toast in CreateTagDialog
            console.error('Failed to delete tag:', error);
          }
        }}
        onClose={() => {
          setShowCreateTag(false);
          setEditingTag(null);
          // After creating/editing tag, refresh tags and reopen selection dialog
          queryClient.invalidateQueries({ queryKey: ['/api/tags'] });
          // Small delay to ensure tags are refreshed before reopening dialog
          setTimeout(() => {
            if (transactionForTag) {
              setShowTagSelect(true);
            }
          }, 100);
        }}
      />
    </div>
  );
}
