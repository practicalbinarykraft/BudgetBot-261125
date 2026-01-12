/**
 * Admin User Detail Page
 *
 * Detailed view of a single user with tabs
 * Junior-Friendly: Simple tabs, clear structure
 */

import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { adminApi } from "@/lib/admin/api/admin-api";
import { adminQueryKeys } from "@/lib/admin/api/admin-query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile } from "@/components/admin/users/user-profile";
import { UserTransactions } from "@/components/admin/users/user-transactions";
import { UserTimeline } from "@/components/admin/users/user-timeline";
import { useTranslation } from "@/i18n/context";
import { Button } from "@/components/ui/button";
import type { MockUser } from "@/lib/admin/api/admin-api";

/**
 * Адаптер для преобразования UserDetails из API в формат MockUser
 * для совместимости с компонентом UserProfile
 */
function adaptUserDetailsToMockUser(userDetails: any): MockUser {
  const stats = userDetails?.stats || {};
  const createdAt = userDetails?.createdAt ? new Date(userDetails.createdAt) : new Date();
  const daysSinceSignup = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  console.log('[DEBUG] adaptUserDetailsToMockUser - userDetails.credits:', userDetails?.credits);
  console.log('[DEBUG] adaptUserDetailsToMockUser - userDetails.credits type:', typeof userDetails?.credits);
  console.log('[DEBUG] adaptUserDetailsToMockUser - userDetails keys:', userDetails ? Object.keys(userDetails) : 'no userDetails');
  console.log('[DEBUG] adaptUserDetailsToMockUser - full userDetails:', userDetails);
  
  // Убеждаемся что credits всегда является объектом
  let creditsData = userDetails?.credits;
  if (!creditsData || typeof creditsData !== 'object') {
    console.error('[DEBUG] adaptUserDetailsToMockUser - WARNING: credits is missing or invalid, using defaults');
    creditsData = { totalGranted: 0, totalUsed: 0, messagesRemaining: 0 };
  }
  
  const credits = {
    total: Number(creditsData.totalGranted) || 0,
    used: Number(creditsData.totalUsed) || 0,
    remaining: Number(creditsData.messagesRemaining) || 0,
  };
  
  console.log('[DEBUG] adaptUserDetailsToMockUser - adapted credits:', credits);
  
  return {
    id: userDetails.id,
    name: userDetails.name || '',
    email: userDetails.email || '',
    telegram: userDetails.telegramId ? {
      id: userDetails.telegramId,
      username: userDetails.telegramUsername || '',
    } : null,
    status: 'active' as const,
    plan: 'free' as const,
    lastActiveAt: stats.lastActiveAt ? new Date(stats.lastActiveAt) : createdAt,
    daysSinceSignup,
    transactionsCount: stats.transactionsCount || 0,
    mrr: 0, // MRR не доступен из текущего API
    ltv: stats.totalIncome || 0, // Используем totalIncome как приближение
    totalSpent: stats.totalExpenses || 0,
    referralCode: null,
    referralsCount: 0,
    referredBy: null,
    stage: 'engaged' as const,
    createdAt,
    credits,
    acquisition: {
      source: 'organic' as const,
      campaign: null,
      medium: null,
      cac: 0,
      firstTouchDate: createdAt,
    },
    engagement: {
      score: 50,
      dau: 0,
      mau: 0,
      lastFeatureUsed: null,
    },
    support: {
      ticketsCount: 0,
      lastTicketDate: null,
    },
    tags: [],
    notes: null,
    paymentHistory: [],
    featureUsage: [],
    abTests: [],
    riskScore: {
      score: 0,
      factors: [],
      lastCalculated: createdAt,
    },
    nextBestAction: null,
  };
}

export default function AdminUserDetailPage() {
  const { t } = useTranslation();
  const [, params] = useRoute("/admin/users/:id");
  const userId = params?.id;

  const { data: user, isLoading, error } = useQuery({
    queryKey: adminQueryKeys.userDetail(userId),
    queryFn: () => adminApi.getUserDetail(userId!),
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{t('admin.user_detail.failed_to_load')}</p>
          <p className="text-gray-500 mt-2">Invalid user ID. Params: {JSON.stringify(params)}</p>
        </div>
      </AdminLayout>
    );
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
          <Skeleton className="h-[500px]" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    // Извлекаем сообщение об ошибке
    let errorMessage = 'Неизвестная ошибка';
    let isUnauthorized = false;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      // Если ошибка содержит статус (например, "401: Unauthorized"), извлекаем его
      const statusMatch = errorMessage.match(/^(\d+):\s*(.+)/);
      if (statusMatch) {
        const [, status, message] = statusMatch;
        if (status === '401') {
          isUnauthorized = true;
          errorMessage = 'Ошибка авторизации: сессия истекла или вы не авторизованы как администратор';
        } else if (status === '404') {
          errorMessage = 'Пользователь не найден';
        } else {
          errorMessage = message;
        }
      }
    }

    return (
      <AdminLayout>
        <div className="text-center py-12 max-w-md mx-auto">
          <p className="text-red-600 text-lg font-semibold mb-2">{t('admin.user_detail.failed_to_load')}</p>
          <p className="text-gray-600 mb-1">User ID: {userId}</p>
          <p className="text-gray-500 text-sm mb-4">{errorMessage}</p>
          {isUnauthorized && (
            <Link href="/admin/login">
              <Button variant="default">Войти в админ-панель</Button>
            </Link>
          )}
        </div>
      </AdminLayout>
    );
  }

  // Преобразуем данные пользователя в формат MockUser для компонента UserProfile
  const adaptedUser = adaptUserDetailsToMockUser(user);
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.user_detail.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('admin.user_detail.subtitle', { userId: user.id })}
            </p>
          </div>
          <Link href="/admin/users">
            <Button variant="outline">
              {t('admin.user_detail.back_to_list')}
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              {t('admin.user_detail.tabs.profile')}
            </TabsTrigger>
            <TabsTrigger value="transactions">
              {t('admin.user_detail.tabs.transactions')}
            </TabsTrigger>
            <TabsTrigger value="timeline">
              {t('admin.user_detail.tabs.timeline')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <UserProfile user={adaptedUser} userId={userId} />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <UserTransactions userId={Number(userId)} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <UserTimeline userId={Number(userId)} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

