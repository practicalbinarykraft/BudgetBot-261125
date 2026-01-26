import React, { useEffect, useState, lazy, Suspense } from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
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
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChatSidebar } from "@/stores/chat-sidebar-store";
import { useTelegramPaddingTopStyle } from "@/hooks/use-telegram-safe-area";

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

// Lazy load dialog components
const AddTransactionDialog = lazy(() =>
  import("@/components/transactions/add-transaction-dialog").then(m => ({ default: m.AddTransactionDialog }))
);


// Landing page with redirect logic for authenticated users
function LandingPageWrapper() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [location] = useLocation();
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

        {/* 404 redirect */}
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
    </Suspense>
  );
}

function AppContent() {
  const { user } = useAuth();
  const { showOnboarding } = useOnboarding();
  const { toggle: toggleAiChat } = useChatSidebar();
  const isMobile = useIsMobile();
  const telegramPaddingStyle = useTelegramPaddingTopStyle();
  const [location] = useLocation();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    description?: string;
    amount?: string;
    currency?: string;
    category?: string;
    type?: 'income' | 'expense';
    date?: string;
    categoryId?: number | null;
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
          <div className="h-full overflow-y-auto scrollbar-hide">
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
            {/* Header - ВНУТРИ контентной области */}
            <header 
              className="flex-shrink-0 flex items-center justify-center relative p-3 sm:p-4 border-b bg-background h-[72px] sm:h-[80px]"
              style={telegramPaddingStyle}
            >
              <div className="hidden sm:flex absolute left-3 sm:left-4">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
              </div>
              <div className="flex items-center gap-2">
                <NotificationsBell 
                  onNotificationClick={(notification: Notification) => {
                    // Extract transaction data from notification
                    const transactionData = notification.transactionData as any;
                    setNotificationData({
                      description: transactionData?.description || notification.message,
                      amount: transactionData?.amount?.toString(),
                      currency: transactionData?.currency,
                      category: transactionData?.category,
                      type: transactionData?.type || (notification.type === 'planned_income' ? 'income' : 'expense'),
                      date: transactionData?.date,
                      categoryId: transactionData?.categoryId,
                    });
                    setShowAddDialog(true);
                  }}
                />
                <CreditsWidget />
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

      {/* Mobile Bottom Navigation - показывается только на мобильных */}
      {isMobile && user && (
        <>
          <MobileBottomNav
            onMenuClick={() => setShowMobileMenu(true)}
            onAddClick={() => setShowAddDialog(prev => !prev)}
            onAiChatClick={toggleAiChat}
          />
          <MobileMenuSheet
            open={showMobileMenu}
            onOpenChange={setShowMobileMenu}
          />
          <Suspense fallback={null}>
            <AddTransactionDialog
              open={showAddDialog}
              onOpenChange={(open) => {
                setShowAddDialog(open);
                if (!open) {
                  // Clear notification data when dialog closes
                  setNotificationData(null);
                }
              }}
              defaultDescription={notificationData?.description}
              defaultAmount={notificationData?.amount}
              defaultCurrency={notificationData?.currency}
              defaultCategory={notificationData?.category}
              defaultType={notificationData?.type}
              defaultDate={notificationData?.date}
              defaultCategoryId={notificationData?.categoryId}
            />
          </Suspense>
        </>
      )}
    </>
  );
}

export default function App() {
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
