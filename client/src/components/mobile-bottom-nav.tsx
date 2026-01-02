/**
 * Mobile Bottom Navigation Bar
 * 
 * Показывается только на мобильных устройствах (<640px)
 * 6 кнопок: Главная, Транзакции, +, Аналитика, AI Chat, Меню
 * Junior-Friendly: ~90 строк, только иконки
 */

import { Link, useLocation } from "wouter";
import { Home, Receipt, Plus, BarChart3, MessageCircle, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";

interface MobileBottomNavProps {
  onMenuClick: () => void;
  onAddClick: () => void;
  onAiChatClick: () => void;
}

export function MobileBottomNav({ onMenuClick, onAddClick, onAiChatClick }: MobileBottomNavProps) {
  const [location] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    {
      icon: Home,
      href: "/app/dashboard",
      label: "Главная",
    },
    {
      icon: Receipt,
      href: "/app/transactions",
      label: "Транзакции",
    },
    {
      icon: BarChart3,
      href: "/app/expenses/analytics",
      label: "Аналитика",
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {/* Главная */}
        <Link href="/app/dashboard">
          <button
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-all",
              location === "/app/dashboard" || location === "/app/dashboard-mobile-demo"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-accent/50"
            )}
            aria-label="Главная"
          >
            <Home className="h-6 w-6" />
          </button>
        </Link>

        {/* Транзакции */}
        <Link href="/app/transactions">
          <button
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-all",
              location === "/app/transactions"
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-accent/50"
            )}
            aria-label="Транзакции"
          >
            <Receipt className="h-6 w-6" />
          </button>
        </Link>

        {/* Кнопка + (добавить транзакцию) - БОЛЬШАЯ СИНЯЯ */}
        <button
          onClick={onAddClick}
          className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          aria-label="Добавить транзакцию"
        >
          <Plus className="h-7 w-7" strokeWidth={2.5} />
        </button>

        {/* AI Chat - БОЛЬШАЯ ФИОЛЕТОВАЯ */}
        <button
          onClick={onAiChatClick}
          className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          aria-label="AI чат"
        >
          <MessageCircle className="h-7 w-7" strokeWidth={2.5} />
        </button>

        {/* Аналитика */}
        <Link href="/app/expenses/analytics">
          <button
            className={cn(
              "flex items-center justify-center w-12 h-12 rounded-xl transition-all",
              location === "/app/expenses/analytics" || location.startsWith("/app/analytics") || location.startsWith("/app/advanced-analytics")
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:bg-accent/50"
            )}
            aria-label="Аналитика"
          >
            <BarChart3 className="h-6 w-6" />
          </button>
        </Link>

        {/* Ещё (меню) */}
        <button
          onClick={onMenuClick}
          className="flex items-center justify-center w-12 h-12 rounded-xl text-muted-foreground hover:bg-accent/50 transition-all"
          aria-label="Меню"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
    </nav>
  );
}
