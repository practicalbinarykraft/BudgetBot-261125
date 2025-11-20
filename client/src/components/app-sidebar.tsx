import {
  LayoutDashboard,
  CreditCard,
  Wallet,
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
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
  SidebarHeader,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/i18n";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { t } = useTranslation();
  
  const menuItems = [
    {
      id: 'dashboard',
      title: t("nav.dashboard"),
      url: "/app/dashboard",
      icon: LayoutDashboard,
    },
    {
      id: 'transactions',
      title: t("nav.transactions"),
      url: "/app/transactions",
      icon: CreditCard,
    },
    {
      id: 'wallets',
      title: t("nav.wallets"),
      url: "/app/wallets",
      icon: Wallet,
    },
    {
      id: 'categories',
      title: t("nav.categories"),
      url: "/app/categories",
      icon: Tag,
    },
    {
      id: 'tags',
      title: t("nav.tags"),
      url: "/app/tags",
      icon: Users,
    },
    {
      id: 'recurring',
      title: t("nav.recurring"),
      url: "/app/recurring",
      icon: Repeat,
    },
    {
      id: 'wishlist',
      title: t("nav.wishlist"),
      url: "/app/wishlist",
      icon: Heart,
    },
    {
      id: 'planned_expenses',
      title: t("nav.planned_expenses"),
      url: "/app/planned-expenses",
      icon: Calendar,
    },
    {
      id: 'planned_income',
      title: t("nav.planned_income"),
      url: "/app/planned-income",
      icon: Coins,
    },
    {
      id: 'budgets',
      title: t("nav.budgets"),
      url: "/app/budgets",
      icon: TrendingDown,
    },
    {
      id: 'product_catalog',
      title: t("nav.product_catalog"),
      url: "/app/product-catalog",
      icon: Package,
    },
    {
      id: 'ai_analysis',
      title: t("nav.ai_analysis"),
      url: "/app/ai-analysis",
      icon: Sparkles,
    },
    {
      id: 'settings',
      title: t("nav.settings"),
      url: "/app/settings",
      icon: Settings,
    },
  ];

  const { data: sortingStats } = useQuery<{ unsortedCount: number }>({
    queryKey: ['/api/sorting/stats'],
    enabled: !!user,
  });

  const unsortedCount = sortingStats?.unsortedCount ?? 0;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold mb-2">
            Budget Buddy
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`nav-${item.id}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.url === '/app/transactions' && unsortedCount > 0 && (
                        <Badge 
                          variant="outline" 
                          className="ml-auto bg-muted" 
                          data-testid="badge-unsorted-count"
                        >
                          {unsortedCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {t("common.logout")}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
