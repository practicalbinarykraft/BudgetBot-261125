import { useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CategoryTab } from '@/components/analytics/tabs/category-tab';
import { PersonTab } from '@/components/analytics/tabs/person-tab';
import { TypeTab } from '@/components/analytics/tabs/type-tab';
import { UnsortedTab } from '@/components/analytics/tabs/unsorted-tab';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n';
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { MobileMenuSheet } from "@/components/mobile-menu-sheet";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ExpensesAnalyticsPage() {
  const [period, setPeriod] = useState('month');

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isMobile = useIsMobile();  const [activeTab, setActiveTab] = useState('category');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  const migrateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/migrate-transaction-classifications', {});
      return res.json();
    },
    onSuccess: (data: { updated: number; message: string }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/analytics'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'], exact: false });
      toast({
        title: t('analytics.migration_complete'),
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('analytics.migration_failed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <>
      <div className="space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/app/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              {t('analytics.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('analytics.description')}
            </p>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => migrateMutation.mutate()}
            disabled={migrateMutation.isPending}
            data-testid="button-migrate"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${migrateMutation.isPending ? 'animate-spin' : ''}`} />
            {migrateMutation.isPending ? t('analytics.migrating') : t('analytics.fix_unsorted')}
          </Button>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[150px]" data-testid="select-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">{t('analytics.period.week')}</SelectItem>
              <SelectItem value="month">{t('analytics.period.month')}</SelectItem>
              <SelectItem value="year">{t('analytics.period.year')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-list">
          <TabsTrigger value="category" data-testid="tab-category">
            {t('analytics.tab.category')}
          </TabsTrigger>
          <TabsTrigger value="person" data-testid="tab-person">
            {t('analytics.tab.person')}
          </TabsTrigger>
          <TabsTrigger value="type" data-testid="tab-type">
            {t('analytics.tab.type')}
          </TabsTrigger>
          <TabsTrigger value="unsorted" data-testid="tab-unsorted">
            {t('analytics.tab.unsorted')}
          </TabsTrigger>
        </TabsList>

          <TabsContent value="category" className="space-y-4">
            <CategoryTab period={period} />
          </TabsContent>

          <TabsContent value="person" className="space-y-4">
            <PersonTab period={period} />
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <TypeTab period={period} />
          </TabsContent>

          <TabsContent value="unsorted" className="space-y-4">
            <UnsortedTab period={period} />
          </TabsContent>
        </Tabs>
    </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <MobileBottomNav
          onMenuClick={() => setShowMobileMenu(true)}
          onAddClick={() => {
            toast({
              title: "Добавить транзакцию",
              description: "Функция скоро будет доступна!",
            });
          }}
          onAiChatClick={() => {
            toast({
              title: "AI Chat",
              description: "Функция AI чата скоро будет доступна!",
            });
          }}
        />
      )}

      <MobileMenuSheet
        open={showMobileMenu}
        onOpenChange={setShowMobileMenu}
      />

  );
}  );
}
