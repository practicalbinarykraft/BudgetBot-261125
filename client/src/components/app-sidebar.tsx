import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Building2,
  Tag,
  Users,
  Repeat,
  Heart,
  Calendar,
  Coins,
  TrendingDown,
  Sparkles,
  Settings,
  LogOut,
  Package,
  ChevronDown,
  BarChart3,
  Target,
  Cog,
  Moon,
  Sun,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n";
import { useTheme } from "@/hooks/use-theme";

/**
 * App Sidebar - Navigation with 5 main groups
 *
 * Structure:
 * 1. Dashboard (main)
 * 2. Money (transactions, wallets, recurring)
 * 3. Analytics (budgets, AI, categories)
 * 4. Goals (wishlist, planned)
 * 5. Settings
 */
export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const { isMobile, setOpenMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  // Track which groups are expanded
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    money: true,
    analytics: false,
    goals: false,
  });

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Check if any sub-item is active
  const isGroupActive = (urls: string[]) => urls.some(url => location === url);

  // Close sidebar on mobile when clicking a link
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const { data: sortingStats } = useQuery<{ unsortedCount: number }>({
    queryKey: ['/api/sorting/stats'],
    enabled: !!user,
  });

  const unsortedCount = sortingStats?.unsortedCount ?? 0;

  return (
    <Sidebar aria-label={t("nav.main_navigation")}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold mb-2">
            Budget Buddy
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* 1. Dashboard - Always visible */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/app/dashboard"}
                  aria-label={t("nav.dashboard")}
                >
                  <Link href="/app/dashboard" data-testid="nav-dashboard" onClick={handleLinkClick}>
                    <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                    <span>{t("nav.dashboard")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* 2. Money - Transactions, Wallets, Recurring */}
              <Collapsible
                open={openGroups.money}
                onOpenChange={() => toggleGroup('money')}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      aria-expanded={openGroups.money}
                      aria-label={t("nav.money")}
                      className={isGroupActive(['/app/transactions', '/app/wallets', '/app/recurring']) ? 'bg-accent' : ''}
                    >
                      <Wallet className="w-4 h-4" aria-hidden="true" />
                      <span>{t("nav.money")}</span>
                      {unsortedCount > 0 && (
                        <Badge variant="outline" className="ml-auto bg-muted" aria-label={`${unsortedCount} unsorted`}>
                          {unsortedCount}
                        </Badge>
                      )}
                      <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${openGroups.money ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/transactions"}>
                          <Link href="/app/transactions" data-testid="nav-transactions" aria-label={t("nav.transactions")} onClick={handleLinkClick}>
                            <CreditCard className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.transactions")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/wallets"}>
                          <Link href="/app/wallets" data-testid="nav-wallets" aria-label={t("nav.wallets")} onClick={handleLinkClick}>
                            <Wallet className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.wallets")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/recurring"}>
                          <Link href="/app/recurring" data-testid="nav-recurring" aria-label={t("nav.recurring")} onClick={handleLinkClick}>
                            <Repeat className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.recurring")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* 3. Analytics - Budgets, AI, Categories, Tags, Product Catalog */}
              <Collapsible
                open={openGroups.analytics}
                onOpenChange={() => toggleGroup('analytics')}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      aria-expanded={openGroups.analytics}
                      aria-label={t("nav.analytics")}
                      className={isGroupActive(['/app/budgets', '/app/ai-analysis', '/app/categories', '/app/tags', '/app/product-catalog']) ? 'bg-accent' : ''}
                    >
                      <BarChart3 className="w-4 h-4" aria-hidden="true" />
                      <span>{t("nav.analytics")}</span>
                      <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${openGroups.analytics ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/budgets"}>
                          <Link href="/app/budgets" data-testid="nav-budgets" aria-label={t("nav.budgets")} onClick={handleLinkClick}>
                            <TrendingDown className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.budgets")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/ai-analysis"}>
                          <Link href="/app/ai-analysis" data-testid="nav-ai_analysis" aria-label={t("nav.ai_analysis")} onClick={handleLinkClick}>
                            <Sparkles className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.ai_analysis")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/categories"}>
                          <Link href="/app/categories" data-testid="nav-categories" aria-label={t("nav.categories")} onClick={handleLinkClick}>
                            <Tag className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.categories")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/tags"}>
                          <Link href="/app/tags" data-testid="nav-tags" aria-label={t("nav.tags")} onClick={handleLinkClick}>
                            <Users className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.tags")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/product-catalog"}>
                          <Link href="/app/product-catalog" data-testid="nav-product-catalog" aria-label={t("nav.product_catalog")} onClick={handleLinkClick}>
                            <Package className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.product_catalog")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* 4. Goals - Wishlist, Planned Expenses, Planned Income, Assets */}
              <Collapsible
                open={openGroups.goals}
                onOpenChange={() => toggleGroup('goals')}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      aria-expanded={openGroups.goals}
                      aria-label={t("nav.goals")}
                      className={isGroupActive(['/app/wishlist', '/app/planned-expenses', '/app/planned-income', '/app/assets']) ? 'bg-accent' : ''}
                    >
                      <Target className="w-4 h-4" aria-hidden="true" />
                      <span>{t("nav.goals")}</span>
                      <ChevronDown className={`ml-auto h-4 w-4 transition-transform ${openGroups.goals ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/wishlist"}>
                          <Link href="/app/wishlist" data-testid="nav-wishlist" aria-label={t("nav.wishlist")} onClick={handleLinkClick}>
                            <Heart className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.wishlist")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/planned-expenses"}>
                          <Link href="/app/planned-expenses" data-testid="nav-planned_expenses" aria-label={t("nav.planned_expenses")} onClick={handleLinkClick}>
                            <Calendar className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.planned_expenses")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/planned-income"}>
                          <Link href="/app/planned-income" data-testid="nav-planned_income" aria-label={t("nav.planned_income")} onClick={handleLinkClick}>
                            <Coins className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.planned_income")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton asChild isActive={location === "/app/assets"}>
                          <Link href="/app/assets" data-testid="nav-assets" aria-label={t("nav.assets")} onClick={handleLinkClick}>
                            <Building2 className="w-4 h-4" aria-hidden="true" />
                            <span>{t("nav.assets")}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {/* 5. Settings - Always visible */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/app/settings"}
                  aria-label={t("nav.settings")}
                >
                  <Link href="/app/settings" data-testid="nav-settings" onClick={handleLinkClick}>
                    <Settings className="w-4 h-4" aria-hidden="true" />
                    <span>{t("nav.settings")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/app/billing"}
                  aria-label={t("nav.billing")}
                >
                  <Link href="/app/billing" data-testid="nav-billing" onClick={handleLinkClick}>
                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                    <span>{t("nav.billing")}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{t("common.signed_in_as")}</p>
          <p className="text-sm font-medium truncate">{user?.email}</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? t("common.light_theme") : t("common.dark_theme")}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 mr-2" aria-hidden="true" />
                {t("common.light_theme") || "Светлая тема"}
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 mr-2" aria-hidden="true" />
                {t("common.dark_theme") || "Темная тема"}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
            aria-label={t("common.logout")}
          >
            <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
            {t("common.logout")}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
