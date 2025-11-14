import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import TransactionsPage from "@/pages/transactions-page";
import WalletsPage from "@/pages/wallets-page";
import CategoriesPage from "@/pages/categories-page";
import RecurringPage from "@/pages/recurring-page";
import WishlistPage from "@/pages/wishlist-page";
import BudgetsPage from "@/pages/budgets-page";
import AIAnalysisPage from "@/pages/ai-analysis-page";
import SettingsPage from "@/pages/settings-page";
import TagsSettingsPage from "@/pages/tags-settings-page";
import TagDetailPage from "@/pages/tag-detail-page";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/transactions" component={TransactionsPage} />
      <ProtectedRoute path="/wallets" component={WalletsPage} />
      <ProtectedRoute path="/categories" component={CategoriesPage} />
      <ProtectedRoute path="/recurring" component={RecurringPage} />
      <ProtectedRoute path="/wishlist" component={WishlistPage} />
      <ProtectedRoute path="/budgets" component={BudgetsPage} />
      <ProtectedRoute path="/ai-analysis" component={AIAnalysisPage} />
      <ProtectedRoute path="/tags/:id" component={TagDetailPage} />
      <ProtectedRoute path="/tags" component={TagsSettingsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
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
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
          </header>
          <main className="flex-1 overflow-auto p-6 bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
