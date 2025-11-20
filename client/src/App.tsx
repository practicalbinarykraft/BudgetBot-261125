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
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import TransactionsPage from "@/pages/transactions-page";
import WalletsPage from "@/pages/wallets-page";
import CategoriesPage from "@/pages/categories-page";
import RecurringPage from "@/pages/recurring-page";
import WishlistPage from "@/pages/wishlist-page";
import PlannedExpensesPage from "@/pages/planned-expenses-page";
import PlannedIncomePage from "@/pages/planned-income-page";
import BudgetsPage from "@/pages/budgets-page";
import AIAnalysisPage from "@/pages/ai-analysis-page";
import SettingsPage from "@/pages/settings-page";
import TagsSettingsPage from "@/pages/tags-settings-page";
import TagDetailPage from "@/pages/tag-detail-page";
import ExpensesAnalyticsPage from "@/pages/expenses-analytics-page";
import SwipeSortPage from "@/pages/swipe-sort-page";
import AiTrainingHistoryPage from "@/pages/ai-training-history-page";
import ProductCatalogPage from "@/pages/product-catalog-page";
import ProductDetailPage from "@/pages/product-detail-page";
import { useEffect } from "react";

// Landing page with redirect logic for authenticated users
function LandingPageWrapper() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user) {
      setLocation('/app/dashboard');
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  return <LandingPage />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={LandingPageWrapper} />
      <Route path="/login" component={AuthPage} />
      
      {/* Protected app routes */}
      <ProtectedRoute path="/app/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/app/transactions/sort" component={SwipeSortPage} />
      <ProtectedRoute path="/app/transactions" component={TransactionsPage} />
      <ProtectedRoute path="/app/wallets" component={WalletsPage} />
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
      <ProtectedRoute path="/app/settings" component={SettingsPage} />
      <ProtectedRoute path="/app/product-catalog/:id" component={ProductDetailPage} />
      <ProtectedRoute path="/app/product-catalog" component={ProductCatalogPage} />
      
      {/* 404 redirect */}
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (!user) {
    return (
      <main className="flex-1 overflow-auto bg-background">
        <Router />
      </main>
    );
  }

  return (
    <>
      <SidebarProvider style={style as React.CSSProperties}>
        <div className="flex h-screen w-full">
          <AppSidebar />
          <div className="flex flex-col flex-1">
            <header className="flex items-center justify-between p-4 border-b">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
            </header>
            <main className="flex-1 overflow-auto pt-6 px-6 pb-24 bg-background">
              <Router />
            </main>
          </div>
        </div>
      </SidebarProvider>
      
      {/* AI Chat Sidebar - доступен везде */}
      <AIChatSidebar />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <I18nProvider>
            <AppContent />
          </I18nProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
