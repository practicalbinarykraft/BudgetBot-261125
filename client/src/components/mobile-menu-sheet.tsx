/**
 * Mobile Menu Sheet
 * 
 * Выдвижное меню "Ещё" для мобильных устройств
 * Полностью идентично десктопному sidebar
 * Junior-Friendly: структура как в app-sidebar.tsx
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link, useLocation } from "wouter";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import * as React from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { useTelegramSafeArea } from "@/hooks/use-telegram-safe-area";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  const safeArea = useTelegramSafeArea();
  const isMobile = useIsMobile();

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

  // Close sheet when clicking a link
  const handleLinkClick = () => {
    onOpenChange(false);
  };

  // Определяем отступ для Sheet в зависимости от состояния Telegram Mini App
  const getSheetPaddingTop = () => {
    const webApp = window.Telegram?.WebApp;
    const isTelegram = typeof webApp !== 'undefined' && !!webApp?.initData;

    if (isTelegram && webApp) {
      const isExpanded = webApp.isExpanded;
      
      if (isExpanded) {
        // Развернуто на весь экран - нужен отступ сверху
        return isMobile ? 16 : 20;
      } else {
        // Не развернуто - есть шторка, контейнер уже смещен, минимальный отступ
        return isMobile ? 12 : 16;
      }
    } else {
      // Обычный браузер - стандартный отступ
      return isMobile ? 12 : 16;
    }
  };

  const sheetPaddingTop = getSheetPaddingTop();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[300px] sm:w-[340px] flex flex-col [&>button]:!top-4"
        style={{
          top: safeArea.top > 0 ? `${safeArea.top}px` : '0',
          height: safeArea.top > 0 ? `calc(100vh - ${safeArea.top}px)` : '100vh',
          paddingTop: `${sheetPaddingTop}px`,
        }}
      >
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>{t("nav.main_navigation")}</SheetTitle>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-visible mt-6 -mx-6 px-6">
          <div className="space-y-2">
            {/* 1. Dashboard */}
            <Link href="/app/dashboard">
              <button
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-sm",
                  "hover:bg-accent",
                  location === "/app/dashboard" ? "bg-accent text-primary font-medium" : "text-foreground"
                )}
              >
                <LayoutDashboard className="h-5 w-5" />
                <span>{t("nav.dashboard")}</span>
              </button>
            </Link>

            {/* 2. Money - Transactions, Wallets, Recurring */}
            <Collapsible
              open={openGroups.money}
              onOpenChange={() => toggleGroup('money')}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-sm",
                    "hover:bg-accent",
                    isGroupActive(['/app/transactions', '/app/wallets', '/app/recurring']) ? "bg-accent" : ""
                  )}
                >
                  <Wallet className="h-5 w-5" />
                  <span>{t("nav.money")}</span>
                  <ChevronDown className={cn(
                    "ml-auto h-4 w-4 transition-transform",
                    openGroups.money ? 'rotate-180' : ''
                  )} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-6 mt-1 space-y-1">
                  <Link href="/app/transactions">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/transactions" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>{t("nav.transactions")}</span>
                    </button>
                  </Link>
                  <Link href="/app/wallets">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/wallets" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <Wallet className="h-4 w-4" />
                      <span>{t("nav.wallets")}</span>
                    </button>
                  </Link>
                  <Link href="/app/recurring">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/recurring" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <Repeat className="h-4 w-4" />
                      <span>{t("nav.recurring")}</span>
                    </button>
                  </Link>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 3. Analytics - Budgets, AI, Categories, Tags, Product Catalog */}
            <Collapsible
              open={openGroups.analytics}
              onOpenChange={() => toggleGroup('analytics')}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-sm",
                    "hover:bg-accent",
                    isGroupActive(['/app/budgets', '/app/ai-analysis', '/app/categories', '/app/tags', '/app/product-catalog']) ? "bg-accent" : ""
                  )}
                >
                  <BarChart3 className="h-5 w-5" />
                  <span>{t("nav.analytics")}</span>
                  <ChevronDown className={cn(
                    "ml-auto h-4 w-4 transition-transform",
                    openGroups.analytics ? 'rotate-180' : ''
                  )} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-6 mt-1 space-y-1">
                  <Link href="/app/budgets">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/budgets" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <TrendingDown className="h-4 w-4" />
                      <span>{t("nav.budgets")}</span>
                    </button>
                  </Link>
                  <Link href="/app/ai-analysis">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/ai-analysis" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>{t("nav.ai_analysis")}</span>
                    </button>
                  </Link>
                  <Link href="/app/categories">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/categories" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <Tag className="h-4 w-4" />
                      <span>{t("nav.categories")}</span>
                    </button>
                  </Link>
                  <Link href="/app/tags">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/tags" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <Users className="h-4 w-4" />
                      <span>{t("nav.tags")}</span>
                    </button>
                  </Link>
                  <Link href="/app/product-catalog">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/product-catalog" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <Package className="h-4 w-4" />
                      <span>{t("nav.product_catalog")}</span>
                    </button>
                  </Link>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 4. Goals - Wishlist, Planned Expenses, Planned Income, Assets */}
            <Collapsible
              open={openGroups.goals}
              onOpenChange={() => toggleGroup('goals')}
            >
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-sm",
                    "hover:bg-accent",
                    isGroupActive(['/app/wishlist', '/app/planned-expenses', '/app/planned-income', '/app/assets']) ? "bg-accent" : ""
                  )}
                >
                  <Target className="h-5 w-5" />
                  <span>{t("nav.goals")}</span>
                  <ChevronDown className={cn(
                    "ml-auto h-4 w-4 transition-transform",
                    openGroups.goals ? 'rotate-180' : ''
                  )} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-6 mt-1 space-y-1">
                  <Link href="/app/wishlist">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/wishlist" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <Heart className="h-4 w-4" />
                      <span>{t("nav.wishlist")}</span>
                    </button>
                  </Link>
                  <Link href="/app/planned-expenses">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/planned-expenses" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>{t("nav.planned_expenses")}</span>
                    </button>
                  </Link>
                  <Link href="/app/planned-income">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/planned-income" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <Coins className="h-4 w-4" />
                      <span>{t("nav.planned_income")}</span>
                    </button>
                  </Link>
                  <Link href="/app/assets">
                    <button
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-xs",
                        "hover:bg-accent",
                        location === "/app/assets" ? "bg-accent text-primary font-medium" : "text-foreground"
                      )}
                    >
                      <Building2 className="h-4 w-4" />
                      <span>{t("nav.assets")}</span>
                    </button>
                  </Link>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 5. Settings */}
            <Link href="/app/settings">
              <button
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-sm",
                  "hover:bg-accent",
                  location === "/app/settings" ? "bg-accent text-primary font-medium" : "text-foreground"
                )}
              >
                <Settings className="h-5 w-5" />
                <span>{t("nav.settings")}</span>
              </button>
            </Link>

            {/* 6. Billing */}
            <Link href="/app/billing">
              <button
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors text-sm",
                  "hover:bg-accent",
                  location === "/app/billing" ? "bg-accent text-primary font-medium" : "text-foreground"
                )}
              >
                <Sparkles className="h-5 w-5" />
                <span>{t("nav.billing")}</span>
              </button>
            </Link>

            {/* Отступ снизу для комфортного скролла */}
            <div className="h-4"></div>
          </div>
        </div>

        {/* Fixed footer - Пользователь и выход */}
        <div className="flex-shrink-0 border-t pt-4 mt-4 space-y-2">
          <div className="px-3 py-2 text-sm text-muted-foreground">
            <div className="font-medium text-foreground mb-1">{t("common.signed_in_as")}</div>
            <div className="truncate">{user?.email || user?.telegramUsername || user?.name}</div>
          </div>

          <button
            onClick={() => {
              logoutMutation.mutate();
              onOpenChange(false);
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors hover:bg-destructive/10 text-destructive"
          >
            <LogOut className="h-5 w-5" />
            <span>{t("common.logout")}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
