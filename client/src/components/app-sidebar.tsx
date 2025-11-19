import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Tag,
  Users,
  Repeat,
  Heart,
  Calendar,
  TrendingDown,
  Sparkles,
  Settings,
  LogOut,
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
      url: "/",
      icon: LayoutDashboard,
    },
    {
      id: 'transactions',
      title: t("nav.transactions"),
      url: "/transactions",
      icon: CreditCard,
    },
    {
      id: 'wallets',
      title: t("nav.wallets"),
      url: "/wallets",
      icon: Wallet,
    },
    {
      id: 'categories',
      title: t("nav.categories"),
      url: "/categories",
      icon: Tag,
    },
    {
      id: 'tags',
      title: t("nav.tags"),
      url: "/tags",
      icon: Users,
    },
    {
      id: 'recurring',
      title: t("nav.recurring"),
      url: "/recurring",
      icon: Repeat,
    },
    {
      id: 'wishlist',
      title: t("nav.wishlist"),
      url: "/wishlist",
      icon: Heart,
    },
    {
      id: 'planned',
      title: t("nav.planned"),
      url: "/planned",
      icon: Calendar,
    },
    {
      id: 'budgets',
      title: t("nav.budgets"),
      url: "/budgets",
      icon: TrendingDown,
    },
    {
      id: 'ai_analysis',
      title: t("nav.ai_analysis"),
      url: "/ai-analysis",
      icon: Sparkles,
    },
    {
      id: 'settings',
      title: t("nav.settings"),
      url: "/settings",
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
                      {item.url === '/transactions' && unsortedCount > 0 && (
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
      <SidebarRail />
    </Sidebar>
  );
}
