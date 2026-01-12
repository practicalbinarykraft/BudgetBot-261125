/**
 * Admin Metrics Service
 * 
 * Junior-Friendly Guide:
 * =====================
 * Этот сервис вычисляет метрики для админ-панели.
 * Метрики показывают состояние бизнеса: количество пользователей,
 * активность, доходы и т.д.
 * 
 * Использование:
 *   import { getHeroMetrics } from './admin-metrics.service';
 *   const metrics = await getHeroMetrics();
 */

import { db } from '../db';
import { users, transactions } from '@shared/schema';
import { sql, eq, and, gte, lte, count, sum } from 'drizzle-orm';
import { logError } from '../lib/logger';

/**
 * Простой in-memory кэш для метрик
 * Для джуна: кэш хранит данные в памяти на 5 минут, чтобы не нагружать БД
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

/**
 * Получает данные из кэша или выполняет функцию
 */
async function getCached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const data = await fn();
  cache.set(key, {
    data,
    expiresAt: now + CACHE_TTL,
  });

  return data;
}

/**
 * Очищает кэш (можно вызвать после важных изменений)
 */
export function clearMetricsCache(): void {
  cache.clear();
}

/**
 * Hero Metrics - основные метрики для dashboard
 * 
 * Для джуна: Это главные цифры, которые показывают состояние бизнеса.
 * Они отображаются на главной странице админ-панели.
 */
/**
 * Hero Metrics интерфейс
 * 
 * Основные метрики для dashboard админ-панели.
 * 
 * Примечание: CAC и ltvCacRatio могут быть null, так как CAC не реализован.
 * Требуется интеграция с маркетинговыми платформами для расчета CAC.
 */
export interface HeroMetrics {
  // Основные метрики (ожидаются фронтендом)
  mrr: {
    current: number;
    change: number; // % изменения от предыдущего месяца
    trend: number[]; // За последние 12 месяцев
  };
  totalUsers: {
    current: number;
    activeToday: number;
    change: number; // % изменения за последние 30 дней
  };
  ltv: number; // Lifetime Value
  cac: number | null; // Customer Acquisition Cost (null если недоступно)
  ltvCacRatio: number | null; // LTV:CAC ratio (null если CAC недоступно)
}

/**
 * Получает Hero Metrics
 */
export async function getHeroMetrics(): Promise<HeroMetrics> {
  return getCached('hero-metrics', async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setDate(monthAgo.getDate() - 30);
      const twoMonthsAgo = new Date(today);
      twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

      // Общее количество пользователей
      const [totalUsersResult] = await db
        .select({ count: count() })
        .from(users);

      const totalUsers = totalUsersResult?.count || 0;

      // Пользователи, активные сегодня (создали транзакцию сегодня)
      const [activeTodayResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND DATE(${transactions.date}) = CURRENT_DATE
          )`
        );

      const activeToday = activeTodayResult?.count || 0;

      // Пользователи, активные на этой неделе
      const [activeThisWeekResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND DATE(${transactions.date}) >= ${weekAgo.toISOString().split('T')[0]}
          )`
        );

      const activeThisWeek = activeThisWeekResult?.count || 0;

      // Пользователи, активные в этом месяце
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const [activeThisMonthResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND DATE(${transactions.date}) >= ${monthStart.toISOString().split('T')[0]}
          )`
        );

      const activeThisMonth = activeThisMonthResult?.count || 0;

      // Пользователи месяц назад (для расчета изменения)
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const [activePreviousMonthResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND DATE(${transactions.date}) >= ${previousMonthStart.toISOString().split('T')[0]}
            AND DATE(${transactions.date}) <= ${previousMonthEnd.toISOString().split('T')[0]}
          )`
        );

      const activePreviousMonth = activePreviousMonthResult?.count || 0;
      const userChange = activePreviousMonth > 0
        ? ((activeThisMonth - activePreviousMonth) / activePreviousMonth) * 100
        : 0;

      // Общий доход (сумма всех income транзакций)
      const [totalRevenueResult] = await db
        .select({ total: sum(transactions.amountUsd) })
        .from(transactions)
        .where(eq(transactions.type, 'income'));

      const totalRevenue = parseFloat(totalRevenueResult?.total || '0');

      // Доход за этот месяц
      const [thisMonthRevenueResult] = await db
        .select({ total: sum(transactions.amountUsd) })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'income'),
            gte(sql`DATE(${transactions.date})`, monthStart.toISOString().split('T')[0])
          )
        );

      const thisMonthRevenue = parseFloat(thisMonthRevenueResult?.total || '0');

      // Доход за прошлый месяц
      const [lastMonthRevenueResult] = await db
        .select({ total: sum(transactions.amountUsd) })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'income'),
            gte(sql`DATE(${transactions.date})`, previousMonthStart.toISOString().split('T')[0]),
            lte(sql`DATE(${transactions.date})`, previousMonthEnd.toISOString().split('T')[0])
          )
        );

      const lastMonthRevenue = parseFloat(lastMonthRevenueResult?.total || '0');
      const revenueChange = lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

      // Тренд доходов за последние 12 месяцев
      const revenueTrend: number[] = [];
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const [monthRevenueResult] = await db
          .select({ total: sum(transactions.amountUsd) })
          .from(transactions)
          .where(
            and(
              eq(transactions.type, 'income'),
              gte(sql`DATE(${transactions.date})`, month.toISOString().split('T')[0]),
              lte(sql`DATE(${transactions.date})`, monthEnd.toISOString().split('T')[0])
            )
          );

        revenueTrend.push(parseFloat(monthRevenueResult?.total || '0'));
      }

      // Общее количество транзакций
      const [totalTransactionsResult] = await db
        .select({ count: count() })
        .from(transactions);

      const totalTransactions = totalTransactionsResult?.count || 0;

      // Транзакции за этот месяц
      const [thisMonthTransactionsResult] = await db
        .select({ count: count() })
        .from(transactions)
        .where(gte(sql`DATE(${transactions.date})`, monthStart.toISOString().split('T')[0]));

      const thisMonthTransactions = thisMonthTransactionsResult?.count || 0;

      // Среднее количество транзакций на пользователя
      const averageTransactionsPerUser = totalUsers > 0
        ? totalTransactions / totalUsers
        : 0;

      // Процент активных пользователей
      const activeUserRate = totalUsers > 0
        ? (activeThisMonth / totalUsers) * 100
        : 0;

      // Вычисляем MRR (Monthly Recurring Revenue) - используем доход за месяц как приближение
      const mrr = thisMonthRevenue;
      const previousMRR = lastMonthRevenue;
      const mrrChange = previousMRR > 0 ? ((mrr - previousMRR) / previousMRR) * 100 : 0;

      // Вычисляем LTV (Lifetime Value) - средний доход на пользователя за все время
      const ltv = totalUsers > 0 ? totalRevenue / totalUsers : 0;

      /**
       * CAC (Customer Acquisition Cost) - не реализовано
       * 
       * Требуется интеграция с маркетинговыми платформами (Google Ads, Facebook Ads, etc.)
       * для получения данных о стоимости привлечения клиентов.
       * 
       * Альтернатива: Добавить возможность ввода CAC вручную через админ-панель.
       */
      const cac: null = null;

      /**
       * LTV:CAC ratio - не реализовано
       * 
       * Рассчитывается как LTV / CAC, но недоступен, так как CAC не реализован.
       */
      const ltvCacRatio: null = null;

      // Возвращаем структуру, которую ожидает фронтенд
      return {
        mrr: {
          current: mrr,
          change: mrrChange,
          trend: revenueTrend.slice(-12), // Последние 12 месяцев
        },
        totalUsers: {
          current: totalUsers,
          activeToday,
          change: userChange,
        },
        ltv,
        cac,
        ltvCacRatio,
      };
    } catch (error) {
      logError('Failed to get hero metrics', error as Error);
      throw error;
    }
  });
}

/**
 * Growth Metrics - метрики роста
 */
export interface GrowthMetrics {
  userGrowth: {
    mau: number; // Monthly Active Users
    dau: number; // Daily Active Users
    wau: number; // Weekly Active Users
  };
  retention: {
    d1: number; // Day 1 retention (%)
    d7: number; // Day 7 retention (%)
    d30: number; // Day 30 retention (%)
  };
  newUsers: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    trend: number[]; // За последние 12 месяцев
  };
}

/**
 * Получает Growth Metrics
 */
export async function getGrowthMetrics(): Promise<GrowthMetrics> {
  return getCached('growth-metrics', async () => {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // MAU - пользователи, активные в этом месяце
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const [mauResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND DATE(${transactions.date}) >= ${monthStart.toISOString().split('T')[0]}
          )`
        );

      const mau = mauResult?.count || 0;

      // DAU - пользователи, активные сегодня
      const [dauResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND DATE(${transactions.date}) = CURRENT_DATE
          )`
        );

      const dau = dauResult?.count || 0;

      // WAU - пользователи, активные на этой неделе
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const [wauResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND DATE(${transactions.date}) >= ${weekAgo.toISOString().split('T')[0]}
          )`
        );

      const wau = wauResult?.count || 0;

      // Retention - упрощенная версия
      // D1: пользователи, которые создали транзакцию на следующий день после регистрации
      const [d1Result] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND DATE(${transactions.date}) = DATE(${users.createdAt}) + INTERVAL '1 day'
          )`
        );

      const d1Users = d1Result?.count || 0;
      const [totalNewUsers] = await db
        .select({ count: count() })
        .from(users)
        .where(sql`DATE(${users.createdAt}) >= CURRENT_DATE - INTERVAL '30 days'`);

      const d1Retention = totalNewUsers?.count > 0
        ? (d1Users / totalNewUsers.count) * 100
        : 0;

      // D7 и D30 - аналогично
      const [d7Result] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND DATE(${transactions.date}) BETWEEN DATE(${users.createdAt}) + INTERVAL '1 day'
            AND DATE(${users.createdAt}) + INTERVAL '7 days'
          )`
        );

      const d7Users = d7Result?.count || 0;
      const d7Retention = totalNewUsers?.count > 0
        ? (d7Users / totalNewUsers.count) * 100
        : 0;

      const [d30Result] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND DATE(${transactions.date}) BETWEEN DATE(${users.createdAt}) + INTERVAL '1 day'
            AND DATE(${users.createdAt}) + INTERVAL '30 days'
          )`
        );

      const d30Users = d30Result?.count || 0;
      const d30Retention = totalNewUsers?.count > 0
        ? (d30Users / totalNewUsers.count) * 100
        : 0;

      // Новые пользователи
      const [newUsersToday] = await db
        .select({ count: count() })
        .from(users)
        .where(sql`DATE(${users.createdAt}) = CURRENT_DATE`);

      const [newUsersThisWeek] = await db
        .select({ count: count() })
        .from(users)
        .where(sql`DATE(${users.createdAt}) >= ${weekAgo.toISOString().split('T')[0]}`);

      const [newUsersThisMonth] = await db
        .select({ count: count() })
        .from(users)
        .where(sql`DATE(${users.createdAt}) >= ${monthStart.toISOString().split('T')[0]}`);

      // Тренд новых пользователей за 12 месяцев
      const newUsersTrend: number[] = [];
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const [monthNewUsers] = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              gte(sql`DATE(${users.createdAt})`, month.toISOString().split('T')[0]),
              lte(sql`DATE(${users.createdAt})`, monthEnd.toISOString().split('T')[0])
            )
          );

        newUsersTrend.push(monthNewUsers?.count || 0);
      }

      return {
        userGrowth: {
          mau,
          dau,
          wau,
        },
        retention: {
          d1: d1Retention,
          d7: d7Retention,
          d30: d30Retention,
        },
        newUsers: {
          today: newUsersToday?.count || 0,
          thisWeek: newUsersThisWeek?.count || 0,
          thisMonth: newUsersThisMonth?.count || 0,
          trend: newUsersTrend,
        },
      };
    } catch (error) {
      logError('Failed to get growth metrics', error as Error);
      throw error;
    }
  });
}

/**
 * Revenue Metrics - детальная разбивка MRR
 * 
 * Для джуна: Показывает откуда берется MRR: новые пользователи,
 * расширение (увеличение дохода), сокращение (уменьшение дохода), отток (churn).
 */
export interface RevenueMetrics {
  mrr: {
    total: number;
    newMRR: number; // Доход от новых пользователей в этом месяце
    expansionMRR: number; // Увеличение дохода от существующих пользователей
    contractionMRR: number; // Уменьшение дохода от существующих пользователей
    churnedMRR: number; // Потерянный доход от неактивных пользователей
  };
  arr: number; // Annual Recurring Revenue (MRR * 12)
  arpu: number; // Average Revenue Per User
  churn: {
    userChurnRate: number; // % пользователей, которые стали неактивными
    revenueChurnRate: number; // % дохода, который был потерян
    netRevenueRetention: number; // Net Revenue Retention (%)
  };
}

/**
 * Получает Revenue Metrics
 * 
 * ⚠️ Упрощенная версия: рассчитывается на основе транзакций,
 * так как в системе нет подписок (subscriptions).
 */
export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  return getCached('revenue-metrics', async () => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Общее количество пользователей
      const [totalUsersResult] = await db
        .select({ count: count() })
        .from(users);

      const totalUsers = totalUsersResult?.count || 0;

      // MRR (доход за этот месяц)
      const [thisMonthRevenueResult] = await db
        .select({ total: sum(transactions.amountUsd) })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'income'),
            gte(sql`DATE(${transactions.date})`, monthStart.toISOString().split('T')[0])
          )
        );

      const totalMRR = parseFloat(thisMonthRevenueResult?.total || '0');

      // New MRR: доход от пользователей, зарегистрированных в этом месяце
      const [newMRRResult] = await db
        .select({ total: sum(transactions.amountUsd) })
        .from(transactions)
        .innerJoin(users, eq(transactions.userId, users.id))
        .where(
          and(
            eq(transactions.type, 'income'),
            gte(sql`DATE(${transactions.date})`, monthStart.toISOString().split('T')[0]),
            gte(sql`DATE(${users.createdAt})`, monthStart.toISOString().split('T')[0])
          )
        );

      const newMRR = parseFloat(newMRRResult?.total || '0');

      // Доход за прошлый месяц (для сравнения)
      const [lastMonthRevenueResult] = await db
        .select({ total: sum(transactions.amountUsd) })
        .from(transactions)
        .where(
          and(
            eq(transactions.type, 'income'),
            gte(sql`DATE(${transactions.date})`, previousMonthStart.toISOString().split('T')[0]),
            lte(sql`DATE(${transactions.date})`, previousMonthEnd.toISOString().split('T')[0])
          )
        );

      const lastMonthRevenue = parseFloat(lastMonthRevenueResult?.total || '0');

      // Expansion MRR: увеличение дохода (если текущий месяц > прошлый месяц)
      const expansionMRR = Math.max(0, totalMRR - lastMonthRevenue - newMRR);

      // Contraction MRR: уменьшение дохода (если текущий месяц < прошлый месяц, без учета новых)
      const contractionMRR = Math.min(0, totalMRR - lastMonthRevenue - newMRR);

      // Churned MRR: упрощенная версия - пользователи, которые были активны в прошлом месяце, но не в этом
      // Это очень упрощенная версия, так как нет подписок
      const churnedMRR = 0; // TODO: Реализовать правильный расчет churn

      // ARR (Annual Recurring Revenue)
      const arr = totalMRR * 12;

      // ARPU (Average Revenue Per User)
      const arpu = totalUsers > 0 ? totalMRR / totalUsers : 0;

      // User Churn Rate: пользователи, активные в прошлом месяце, но не в этом
      const [activeLastMonthResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND ${transactions.type} = 'income'
            AND DATE(${transactions.date}) >= ${previousMonthStart.toISOString().split('T')[0]}
            AND DATE(${transactions.date}) <= ${previousMonthEnd.toISOString().split('T')[0]}
          )`
        );

      const activeLastMonth = activeLastMonthResult?.count || 0;

      const [activeThisMonthResult] = await db
        .select({ count: count() })
        .from(users)
        .where(
          sql`EXISTS (
            SELECT 1 FROM ${transactions}
            WHERE ${transactions.userId} = ${users.id}
            AND ${transactions.type} = 'income'
            AND DATE(${transactions.date}) >= ${monthStart.toISOString().split('T')[0]}
          )`
        );

      const activeThisMonth = activeThisMonthResult?.count || 0;

      // Пользователи, которые были активны в прошлом месяце, но не в этом
      const churnedUsers = Math.max(0, activeLastMonth - activeThisMonth);
      const userChurnRate = activeLastMonth > 0 ? (churnedUsers / activeLastMonth) * 100 : 0;

      // Revenue Churn Rate: упрощенная версия
      const revenueChurnRate = lastMonthRevenue > 0 ? (Math.abs(contractionMRR) / lastMonthRevenue) * 100 : 0;

      // Net Revenue Retention: (текущий MRR - new MRR) / прошлый MRR * 100
      const netRevenueRetention = lastMonthRevenue > 0
        ? ((totalMRR - newMRR) / lastMonthRevenue) * 100
        : 100;

      return {
        mrr: {
          total: totalMRR,
          newMRR,
          expansionMRR,
          contractionMRR,
          churnedMRR,
        },
        arr,
        arpu,
        churn: {
          userChurnRate,
          revenueChurnRate,
          netRevenueRetention,
        },
      };
    } catch (error) {
      logError('Failed to get revenue metrics', error as Error);
      throw error;
    }
  });
}

/**
 * Cohort Retention Data - данные для heatmap retention
 */
export interface CohortRetentionData {
  cohortMonth: string; // '2025-01'
  usersCount: number;
  retention: {
    month0: number; // Retention в месяц регистрации (всегда 100%)
    month1: number; // Retention через 1 месяц
    month2: number; // Retention через 2 месяца
    month3: number; // Retention через 3 месяца
    month6: number; // Retention через 6 месяцев
    month12: number; // Retention через 12 месяцев
  };
}

/**
 * Получает Cohort Retention Data
 */
export async function getCohortRetention(): Promise<CohortRetentionData[]> {
  return getCached('cohort-retention', async () => {
    try {
      const now = new Date();
      const cohorts: CohortRetentionData[] = [];

      // Получаем данные за последние 12 месяцев
      for (let i = 11; i >= 0; i--) {
        const cohortDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const cohortMonth = cohortDate.toISOString().slice(0, 7); // 'YYYY-MM'
        const cohortMonthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        // Количество пользователей в этой когорте
        const [cohortUsersResult] = await db
          .select({ count: count() })
          .from(users)
          .where(
            and(
              gte(sql`DATE(${users.createdAt})`, cohortDate.toISOString().split('T')[0]),
              lte(sql`DATE(${users.createdAt})`, cohortMonthEnd.toISOString().split('T')[0])
            )
          );

        const usersCount = cohortUsersResult?.count || 0;

        if (usersCount === 0) {
          // Пропускаем пустые когорты
          continue;
        }

        // Retention для разных периодов
        const retention: CohortRetentionData['retention'] = {
          month0: 100, // Всегда 100% в месяц регистрации
          month1: 0,
          month2: 0,
          month3: 0,
          month6: 0,
          month12: 0,
        };

        // Вычисляем retention для каждого периода
        for (const [periodKey, monthsOffset] of [
          ['month1', 1],
          ['month2', 2],
          ['month3', 3],
          ['month6', 6],
          ['month12', 12],
        ] as const) {
          const retentionDate = new Date(cohortDate);
          retentionDate.setMonth(retentionDate.getMonth() + monthsOffset);
          const retentionDateEnd = new Date(retentionDate.getFullYear(), retentionDate.getMonth() + 1, 0);

          // Пользователи из когорты, которые были активны в этом периоде
          const [activeUsersResult] = await db
            .select({ count: count() })
            .from(users)
            .where(
              and(
                gte(sql`DATE(${users.createdAt})`, cohortDate.toISOString().split('T')[0]),
                lte(sql`DATE(${users.createdAt})`, cohortMonthEnd.toISOString().split('T')[0]),
                sql`EXISTS (
                  SELECT 1 FROM ${transactions}
                  WHERE ${transactions.userId} = ${users.id}
                  AND DATE(${transactions.date}) >= ${retentionDate.toISOString().split('T')[0]}
                  AND DATE(${transactions.date}) <= ${retentionDateEnd.toISOString().split('T')[0]}
                )`
              )
            );

          const activeUsers = activeUsersResult?.count || 0;
          retention[periodKey] = usersCount > 0 ? (activeUsers / usersCount) * 100 : 0;
        }

        cohorts.push({
          cohortMonth,
          usersCount,
          retention,
        });
      }

      return cohorts;
    } catch (error) {
      logError('Failed to get cohort retention', error as Error);
      throw error;
    }
  });
}
