import React, { useEffect, useState, lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { I18nProvider } from "@/i18n";
import { AIChatSidebar } from "@/components/ai-chat-sidebar";
import { PageLoading } from "@/components/loading-spinner";
import { WebSocketProvider } from "@/components/WebSocketProvider";
import { WelcomeDialog, useOnboarding } from "@/components/onboarding/welcome-dialog";
import { CreditsWidget } from "@/components/credits-widget";
import { NotificationsBell } from "@/components/notifications-bell";
import { Notification } from "@shared/schema";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChatSidebar } from "@/stores/chat-sidebar-store";
import { useTelegramPaddingTopStyle } from "@/hooks/use-telegram-safe-area";
import { Wallet, BarChart3, Menu as MenuIcon, Plus, Mic, MessageCircle, Home } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "@/i18n";
import { Link, useLocation } from "wouter";
import { useTelegramSafeArea } from "@/hooks/use-telegram-safe-area";
import { VoiceRecorderAdaptive, ParsedVoiceResult } from "@/components/voice-recorder-adaptive";
import { parseTransactionText, isParseSuccessful } from "@/lib/parse-transaction-text";
import { apiRequest } from "@/lib/queryClient";

// ===== Lazy Load Pages for Better Performance =====
// Critical pages (loaded immediately)
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import RecoverPasswordPage from "@/pages/recover-password-page";
import DashboardPage from "@/pages/dashboard-page";
import DashboardMobileDemoPage from "@/pages/dashboard-mobile-demo-page";
import DashboardV2Page from "@/pages/dashboard-v2-page";

// Non-critical pages (lazy loaded on demand)
const TransactionsPage = lazy(() => import("@/pages/transactions-page"));
const WalletsPage = lazy(() => import("@/pages/wallets-page"));
const CategoriesPage = lazy(() => import("@/pages/categories-page"));
const RecurringPage = lazy(() => import("@/pages/recurring-page"));
const WishlistPage = lazy(() => import("@/pages/wishlist-page"));
const PlannedExpensesPage = lazy(() => import("@/pages/planned-expenses-page"));
const PlannedIncomePage = lazy(() => import("@/pages/planned-income-page"));
const BudgetsPage = lazy(() => import("@/pages/budgets-page"));
const AIAnalysisPage = lazy(() => import("@/pages/ai-analysis-page"));
const SettingsPage = lazy(() => import("@/pages/settings"));
const TagsSettingsPage = lazy(() => import("@/pages/tags-settings-page"));
const CurrencyHistoryPage = lazy(() => import("@/pages/currency-history-page"));
const TagDetailPage = lazy(() => import("@/pages/tag-detail-page"));
const ExpensesAnalyticsPage = lazy(() => import("@/pages/expenses-analytics-page"));
const SwipeSortPage = lazy(() => import("@/pages/swipe-sort-page"));
const AiTrainingHistoryPage = lazy(() => import("@/pages/ai-training-history-page"));
const ProductCatalogPage = lazy(() => import("@/pages/product-catalog-page"));
const ProductDetailPage = lazy(() => import("@/pages/product-detail-page"));
const AssetsPage = lazy(() => import("@/pages/assets"));
const AssetDetailPage = lazy(() => import("@/pages/asset-detail"));
const AdvancedAnalyticsPage = lazy(() => import("@/pages/advanced-analytics-page"));
const BillingPage = lazy(() => import("@/pages/billing-page"));
const ReferralPage = lazy(() => import("@/pages/referral-page"));

// Lazy load dialog components
const AddTransactionDialog = lazy(() =>
  import("@/components/transactions/add-transaction-dialog").then(m => ({ default: m.AddTransactionDialog }))
);


// Landing page with redirect logic for authenticated users
function LandingPageWrapper() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Редиректим авторизованных пользователей на dashboard
    // На мобильных устройствах редиректим на dashboard-v2
    if (user) {
      const dashboardPath = isMobile ? '/app/dashboard-v2' : '/app/dashboard';
      setLocation(dashboardPath);
    }
  }, [user, setLocation, isMobile]);

  if (user) {
    return null;
  }

  return <LandingPage />;
}


function Router() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={LandingPageWrapper} />
        <Route path="/login" component={AuthPage} />
        <Route path="/recover-password" component={RecoverPasswordPage} />

        {/* Protected app routes */}
        <ProtectedRoute path="/app/dashboard-mobile-demo" component={DashboardMobileDemoPage} />
        <ProtectedRoute path="/app/dashboard-v2" component={DashboardV2Page} />
        <ProtectedRoute path="/app/dashboard" component={DashboardPage} />
        <ProtectedRoute path="/app/billing" component={BillingPage} />
        <ProtectedRoute path="/app/transactions/sort" component={SwipeSortPage} />
        <ProtectedRoute path="/app/transactions" component={TransactionsPage} />
        <ProtectedRoute path="/app/wallets" component={WalletsPage} />
        <ProtectedRoute path="/app/assets/:id" component={AssetDetailPage} />
        <ProtectedRoute path="/app/assets" component={AssetsPage} />
        <ProtectedRoute path="/app/categories" component={CategoriesPage} />
        <ProtectedRoute path="/app/recurring" component={RecurringPage} />
        <ProtectedRoute path="/app/wishlist" component={WishlistPage} />
        <ProtectedRoute path="/app/planned-expenses" component={PlannedExpensesPage} />
        <ProtectedRoute path="/app/planned-income" component={PlannedIncomePage} />
        <ProtectedRoute path="/app/budgets" component={BudgetsPage} />
        <ProtectedRoute path="/app/ai-analysis" component={AIAnalysisPage} />
        <ProtectedRoute path="/app/ai-training/history" component={AiTrainingHistoryPage} />
        <ProtectedRoute path="/app/expenses/analytics" component={ExpensesAnalyticsPage} />
        <ProtectedRoute path="/app/tags/:id" component={TagDetailPage} />
        <ProtectedRoute path="/app/tags" component={TagsSettingsPage} />
        <ProtectedRoute path="/app/settings/billing" component={BillingPage} />
        <ProtectedRoute path="/app/settings" component={SettingsPage} />
        <ProtectedRoute path="/app/currency/history" component={CurrencyHistoryPage} />
        <ProtectedRoute path="/app/product-catalog/:id" component={ProductDetailPage} />
        <ProtectedRoute path="/app/product-catalog" component={ProductCatalogPage} />
        <ProtectedRoute path="/app/analytics/advanced" component={AdvancedAnalyticsPage} />
        <ProtectedRoute path="/app/referral" component={ReferralPage} />

        {/* 404 redirect */}
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  console.log('[AppContent] Rendering...');
  const { user } = useAuth();
  const { showOnboarding } = useOnboarding();
  const { toggle: toggleAiChat } = useChatSidebar();
  const isMobile = useIsMobile();
  const telegramPaddingStyle = useTelegramPaddingTopStyle();
  const [location] = useLocation();
  const { language } = useTranslation();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [voiceData, setVoiceData] = useState<{
    description?: string;
    amount?: string;
    currency?: string;
    category?: string;
    type?: 'income' | 'expense';
  }>({});
  const [interimTranscription, setInterimTranscription] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const safeArea = useTelegramSafeArea();
  const { isOpen: isChatOpen, open: openAiChat } = useChatSidebar();
  
  // Fetch wallets for total balance
  const { data: walletsResponse } = useQuery<{ data: Array<{
    id: number;
    name: string;
    balanceUsd: string;
  }>; pagination: unknown }>({
    queryKey: ['/api/wallets'],
    enabled: !!user,
  });

  const wallets = walletsResponse?.data;
  const totalBalanceUsd = wallets?.reduce((sum, w) =>
    sum + parseFloat(w.balanceUsd || '0'), 0) || 0;

  // Format currency amount (simple version for header)
  const formatCurrency = (usdAmount: number): string => {
    return new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(usdAmount);
  };
  const [notificationData, setNotificationData] = useState<{
    description?: string;
    amount?: string;
    currency?: string;
    category?: string;
    type?: 'income' | 'expense';
    date?: string;
    categoryId?: number | null;
    notificationId?: number;
  } | null>(null);
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Check if we're on dashboard-v2 page (experimental page without header/nav)
  const isDashboardV2 = location === '/app/dashboard-v2';

  // Hide body scrollbar for dashboard-v2
  useEffect(() => {
    if (isDashboardV2) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDashboardV2]);

  // Show onboarding dialog after user logs in
  useEffect(() => {
    if (user && showOnboarding) {
      setOnboardingOpen(true);
    }
  }, [user, showOnboarding]);

  // Public routes (login, landing) - no layout
  if (!user) {
    return (
      <main className="flex-1 overflow-auto bg-background">
        <Router />
      </main>
    );
  }

  // Dashboard V2 - minimal layout without header and sidebar
  if (isDashboardV2) {
    return (
      <>
        <main className="h-screen w-full overflow-hidden bg-background">
          <div className="h-full overflow-y-scroll scrollbar-hide bg-background">
            <Router />
          </div>
        </main>
        {/* Onboarding dialog for new users */}
        <WelcomeDialog
          open={onboardingOpen}
          onComplete={() => setOnboardingOpen(false)}
        />
        {/* AI Chat Sidebar - доступен везде */}
        <AIChatSidebar />
      </>
    );
  }

  // Regular app routes - with AppSidebar and header
  return (
    <>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full overflow-hidden">
          {/* Сайдбар только на десктопе */}
          <div className="hidden sm:block">
            <AppSidebar />
          </div>
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Header - Dashboard V2 style */}
            <header 
              className="flex-shrink-0 flex items-center justify-between p-3 sm:p-4 relative bg-background h-[72px] sm:h-[80px]"
              style={telegramPaddingStyle}
            >
              {/* Left side - Wallet balance and Notifications */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Sidebar trigger on desktop */}
                <div className="hidden sm:flex flex-shrink-0">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                </div>
                {/* Wallet balance */}
                <Link href="/app/wallets" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
                  <Wallet className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm font-medium whitespace-nowrap">
                    {formatCurrency(totalBalanceUsd)}
                  </span>
                </Link>
                <div className="flex-shrink-0">
                  <NotificationsBell 
                    onNotificationClick={(notification: Notification) => {
                      console.log('[App] onNotificationClick called', { notificationId: notification.id, transactionData: notification.transactionData });
                      // Extract transaction data from notification
                      const transactionData = notification.transactionData as any;
                      const notificationDataToSet = {
                        description: transactionData?.description || notification.message,
                        amount: transactionData?.amount?.toString(),
                        currency: transactionData?.currency,
                        category: transactionData?.category,
                        type: transactionData?.type || (notification.type === 'planned_income' ? 'income' : 'expense'),
                        date: transactionData?.date,
                        categoryId: transactionData?.categoryId,
                        notificationId: notification.id,
                      };
                      console.log('[App] Setting notificationData and opening dialog', notificationDataToSet);
                      setNotificationData(notificationDataToSet);
                      setShowAddDialog(true);
                      console.log('[App] Dialog should be open now');
                    }}
                  />
                </div>
              </div>
              
              {/* Center - CreditsWidget */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-8 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto">
                  <CreditsWidget />
                </div>
              </div>
              
              {/* Right side - Dashboard link and Menu */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <Link href="/app/dashboard">
                  <button
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity flex-shrink-0"
                    aria-label={language === 'ru' ? 'Панель управления' : 'Dashboard'}
                  >
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                  </button>
                </Link>
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity flex-shrink-0"
                  aria-label={language === 'ru' ? 'Меню' : 'Menu'}
                >
                  <MenuIcon className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </header>
            <main className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-20 sm:pb-6 bg-background">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>

      {/* Onboarding dialog for new users */}
      <WelcomeDialog
        open={onboardingOpen}
        onComplete={() => setOnboardingOpen(false)}
      />

      {/* AI Chat Sidebar - доступен везде */}
      <AIChatSidebar />

      {/* Add Transaction Dialog - доступен везде */}
      <Suspense fallback={null}>
        <AddTransactionDialog
          open={showAddDialog}
          onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) {
              // Clear notification and voice data when dialog closes
              setNotificationData(null);
              setVoiceData({});
            }
          }}
          defaultDescription={notificationData?.description || voiceData.description}
          defaultAmount={notificationData?.amount || voiceData.amount}
          defaultCurrency={notificationData?.currency || voiceData.currency}
          defaultCategory={notificationData?.category || voiceData.category}
          defaultType={notificationData?.type || voiceData.type}
          defaultDate={notificationData?.date}
          defaultCategoryId={notificationData?.categoryId}
          notificationId={notificationData?.notificationId}
        />
      </Suspense>

      {/* Mobile Menu Sheet - доступен всегда через кнопку меню в хедере */}
      {user && (
        <MobileMenuSheet
          open={showMobileMenu}
          onOpenChange={setShowMobileMenu}
        />
      )}

      {/* Floating Action Buttons - как на dashboard-v2, для всех страниц кроме dashboard-v2 */}
      {!isDashboardV2 && user && !isChatOpen && (
        <>
          <div 
            className="fixed bottom-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50"
            style={{ 
              paddingBottom: `${safeArea?.bottom ?? 0}px`,
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
                    onResult={async (text: string) => {
                      if (!text || text.trim().length === 0) return;
                      const localParsed = parseTransactionText(text);
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
                          setVoiceData({
                            description: localParsed.description,
                            amount: localParsed.amount?.toString(),
                            currency: localParsed.currency || undefined,
                            category: localParsed.category || undefined,
                            type: localParsed.type,
                          });
                        }
                      } catch (error) {
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
                    }}
                    onParsedResult={(result: ParsedVoiceResult) => {
                      setVoiceData({
                        description: result.parsed.description,
                        amount: result.parsed.amount,
                        currency: result.parsed.currency,
                        category: result.parsed.category,
                        type: result.parsed.type,
                      });
                      setInterimTranscription("");
                      setIsVoiceRecording(false);
                      setShowAddDialog(true);
                      setShowVoiceInput(false);
                    }}
                    onInterimResult={(fullText: string) => {
                      setInterimTranscription(fullText);
                      setIsVoiceRecording(true);
                    }}
                    onRecordingChange={setIsVoiceRecording}
                    onError={setVoiceError}
                    className="w-16 h-16"
                  />
                  
                  {voiceError && (
                    <div className="w-full px-4 py-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm text-red-600 dark:text-red-400 text-center">
                        {voiceError}
                      </p>
                    </div>
                  )}
                  
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
                    setInterimTranscription("");
                    setIsVoiceRecording(false);
                    setVoiceError(null);
                  }}
                  className="w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors"
                >
                  {language === 'ru' ? 'Отмена' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function App() {
  console.log('[App] Rendering App component');
  return (
    <TooltipProvider delayDuration={300}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <I18nProvider>
              <WebSocketProvider>
                <AppContent />
              </WebSocketProvider>
            </I18nProvider>
          </AuthProvider>
        </QueryClientProvider>
      <Toaster />
    </TooltipProvider>
  );
}
