/**
 * Admin Analytics Service
 * 
 * Junior-Friendly Guide:
 * =====================
 * Этот сервис предоставляет аналитику для админ-панели:
 * - Funnel Analysis: воронка конверсии пользователей
 * - Feature Adoption: использование фич
 * - User Segments: сегменты пользователей
 * 
 * Использование:
 *   import { getFunnelAnalysis, getFeatureAdoption, getUserSegments } from './admin-analytics.service';
 */

import { db } from '../db';
import { users, transactions, wallets, categories, budgets, recurring, auditLog } from '@shared/schema';
import { sql, eq, and, gte, count, desc } from 'drizzle-orm';
import { logError } from '../lib/logger';

/**
 * Funnel Analysis - воронка конверсии
 * 
 * Для джуна: Воронка показывает сколько пользователей прошло каждый шаг:
 * 1. Зарегистрировались
 * 2. Создали первую транзакцию
 * 3. Создали кошелек
 * 4. Создали категорию
 * 5. Создали бюджет
 * 
 * Conversion rate показывает процент прошедших каждый шаг.
 */
export interface FunnelStep {
  step: string;
  count: number;
  conversionRate: number; // % от предыдущего шага
  avgTimeToComplete: number; // Среднее время в днях
}

export interface FunnelAnalysis {
  steps: FunnelStep[];
  totalUsers: number;
  overallConversion: number; // % дошедших до конца воронки
}

export async function getFunnelAnalysis(): Promise<FunnelAnalysis> {
  try {
    // Шаг 1: Зарегистрировались
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users);

    const totalUsers = totalUsersResult?.count || 0;

    // Шаг 2: Создали первую транзакцию
    const [firstTransactionResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${transactions}
          WHERE ${transactions.userId} = ${users.id}
        )`
      );

    const firstTransactionCount = firstTransactionResult?.count || 0;

    // Шаг 3: Создали кошелек
    const [walletResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${wallets}
          WHERE ${wallets.userId} = ${users.id}
        )`
      );

    const walletCount = walletResult?.count || 0;

    // Шаг 4: Создали категорию
    const [categoryResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${categories}
          WHERE ${categories.userId} = ${users.id}
        )`
      );

    const categoryCount = categoryResult?.count || 0;

    // Шаг 5: Создали бюджет
    const [budgetResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${budgets}
          WHERE ${budgets.userId} = ${users.id}
        )`
      );

    const budgetCount = budgetResult?.count || 0;

    // Вычисляем среднее время между шагами
    // Время от регистрации до первой транзакции
    const [avgTimeToFirstTransaction] = await db
      .select({
        avgDays: sql<number>`AVG(
          EXTRACT(DAY FROM (
            (SELECT MIN(${transactions.date}) FROM ${transactions} WHERE ${transactions.userId} = ${users.id}) - ${users.createdAt}
          ))
        )`,
      })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${transactions}
          WHERE ${transactions.userId} = ${users.id}
        )`
      );

    const avgTimeToFirst = parseFloat(avgTimeToFirstTransaction?.avgDays?.toString() || '0') || 0;

    // Формируем воронку
    const steps: FunnelStep[] = [
      {
        step: 'signup',
        count: totalUsers,
        conversionRate: 100, // Все начали отсюда
        avgTimeToComplete: 0,
      },
      {
        step: 'first_transaction',
        count: firstTransactionCount,
        conversionRate: totalUsers > 0 ? (firstTransactionCount / totalUsers) * 100 : 0,
        avgTimeToComplete: avgTimeToFirst,
      },
      {
        step: 'create_wallet',
        count: walletCount,
        conversionRate: firstTransactionCount > 0 ? (walletCount / firstTransactionCount) * 100 : 0,
        avgTimeToComplete: 0, // Упрощенно, можно вычислить
      },
      {
        step: 'create_category',
        count: categoryCount,
        conversionRate: walletCount > 0 ? (categoryCount / walletCount) * 100 : 0,
        avgTimeToComplete: 0,
      },
      {
        step: 'create_budget',
        count: budgetCount,
        conversionRate: categoryCount > 0 ? (budgetCount / categoryCount) * 100 : 0,
        avgTimeToComplete: 0,
      },
    ];

    const overallConversion = totalUsers > 0 ? (budgetCount / totalUsers) * 100 : 0;

    return {
      steps,
      totalUsers,
      overallConversion,
    };
  } catch (error) {
    logError('Failed to get funnel analysis', error as Error);
    throw error;
  }
}

/**
 * Feature Adoption - использование фич
 * 
 * Для джуна: Показывает сколько пользователей используют каждую фичу.
 * Adoption rate = % пользователей, которые использовали фичу хотя бы раз.
 */
export interface FeatureAdoption {
  feature: string;
  usersCount: number;
  adoptionRate: number; // % от общего числа пользователей
  totalUsage: number; // Общее количество использований
  avgUsagePerUser: number; // Среднее использование на пользователя
}

export interface FeatureAdoptionResult {
  features: FeatureAdoption[];
  totalUsers: number;
}

export async function getFeatureAdoption(): Promise<FeatureAdoptionResult> {
  try {
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users);

    const totalUsers = totalUsersResult?.count || 0;

    if (totalUsers === 0) {
      return {
        features: [],
        totalUsers: 0,
      };
    }

    const features: FeatureAdoption[] = [];

    // Фича: Транзакции
    const [transactionsUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${transactions}
          WHERE ${transactions.userId} = ${users.id}
        )`
      );

    const [transactionsTotal] = await db
      .select({ count: count() })
      .from(transactions);

    const transactionsCount = transactionsUsers?.count || 0;
    const transactionsTotalCount = transactionsTotal?.count || 0;

    features.push({
      feature: 'transactions',
      usersCount: transactionsCount,
      adoptionRate: (transactionsCount / totalUsers) * 100,
      totalUsage: transactionsTotalCount,
      avgUsagePerUser: transactionsCount > 0 ? transactionsTotalCount / transactionsCount : 0,
    });

    // Фича: Кошельки
    const [walletsUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${wallets}
          WHERE ${wallets.userId} = ${users.id}
        )`
      );

    const [walletsTotal] = await db
      .select({ count: count() })
      .from(wallets);

    const walletsCount = walletsUsers?.count || 0;
    const walletsTotalCount = walletsTotal?.count || 0;

    features.push({
      feature: 'wallets',
      usersCount: walletsCount,
      adoptionRate: (walletsCount / totalUsers) * 100,
      totalUsage: walletsTotalCount,
      avgUsagePerUser: walletsCount > 0 ? walletsTotalCount / walletsCount : 0,
    });

    // Фича: Категории
    const [categoriesUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${categories}
          WHERE ${categories.userId} = ${users.id}
        )`
      );

    const [categoriesTotal] = await db
      .select({ count: count() })
      .from(categories);

    const categoriesCount = categoriesUsers?.count || 0;
    const categoriesTotalCount = categoriesTotal?.count || 0;

    features.push({
      feature: 'categories',
      usersCount: categoriesCount,
      adoptionRate: (categoriesCount / totalUsers) * 100,
      totalUsage: categoriesTotalCount,
      avgUsagePerUser: categoriesCount > 0 ? categoriesTotalCount / categoriesCount : 0,
    });

    // Фича: Бюджеты
    const [budgetsUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${budgets}
          WHERE ${budgets.userId} = ${users.id}
        )`
      );

    const [budgetsTotal] = await db
      .select({ count: count() })
      .from(budgets);

    const budgetsCount = budgetsUsers?.count || 0;
    const budgetsTotalCount = budgetsTotal?.count || 0;

    features.push({
      feature: 'budgets',
      usersCount: budgetsCount,
      adoptionRate: (budgetsCount / totalUsers) * 100,
      totalUsage: budgetsTotalCount,
      avgUsagePerUser: budgetsCount > 0 ? budgetsTotalCount / budgetsCount : 0,
    });

    // Фича: Повторяющиеся транзакции
    const [recurringUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${recurring}
          WHERE ${recurring.userId} = ${users.id}
        )`
      );

    const [recurringTotal] = await db
      .select({ count: count() })
      .from(recurring);

    const recurringCount = recurringUsers?.count || 0;
    const recurringTotalCount = recurringTotal?.count || 0;

    features.push({
      feature: 'recurring',
      usersCount: recurringCount,
      adoptionRate: (recurringCount / totalUsers) * 100,
      totalUsage: recurringTotalCount,
      avgUsagePerUser: recurringCount > 0 ? recurringTotalCount / recurringCount : 0,
    });

    return {
      features,
      totalUsers,
    };
  } catch (error) {
    logError('Failed to get feature adoption', error as Error);
    throw error;
  }
}

/**
 * User Segments - сегменты пользователей
 * 
 * Для джуна: Разделяем пользователей на группы по поведению:
 * - New Users: зарегистрировались недавно
 * - Active Users: активные (создали транзакцию за последние 30 дней)
 * - Power Users: много транзакций и активное использование
 * - At Risk: неактивные (нет транзакций за 60+ дней)
 * - Churned: неактивные 90+ дней
 */
export interface UserSegment {
  segment: string;
  count: number;
  percentage: number; // % от общего числа пользователей
  description: string;
}

export interface UserSegmentsResult {
  segments: UserSegment[];
  totalUsers: number;
}

export async function getUserSegments(): Promise<UserSegmentsResult> {
  try {
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(users);

    const totalUsers = totalUsersResult?.count || 0;

    if (totalUsers === 0) {
      return {
        segments: [],
        totalUsers: 0,
      };
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // New Users: зарегистрировались за последние 30 дней
    const [newUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo));

    const newUsers = newUsersResult?.count || 0;

    // Active Users: создали транзакцию за последние 30 дней
    const [activeUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${transactions}
          WHERE ${transactions.userId} = ${users.id}
          AND DATE(${transactions.date}) >= ${thirtyDaysAgo.toISOString().split('T')[0]}
        )`
      );

    const activeUsers = activeUsersResult?.count || 0;

    // Power Users: 50+ транзакций и активны за последние 30 дней
    const [powerUsersResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${transactions}
          WHERE ${transactions.userId} = ${users.id}
          AND DATE(${transactions.date}) >= ${thirtyDaysAgo.toISOString().split('T')[0]}
          GROUP BY ${transactions.userId}
          HAVING COUNT(*) >= 50
        )`
      );

    const powerUsers = powerUsersResult?.count || 0;

    // At Risk: последняя транзакция 30-60 дней назад
    const [atRiskResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`EXISTS (
          SELECT 1 FROM ${transactions}
          WHERE ${transactions.userId} = ${users.id}
          AND DATE(${transactions.date}) >= ${sixtyDaysAgo.toISOString().split('T')[0]}
          AND DATE(${transactions.date}) < ${thirtyDaysAgo.toISOString().split('T')[0]}
        )`
      );

    const atRisk = atRiskResult?.count || 0;

    // Churned: последняя транзакция 60+ дней назад или никогда не было
    const [churnedResult] = await db
      .select({ count: count() })
      .from(users)
      .where(
        sql`NOT EXISTS (
          SELECT 1 FROM ${transactions}
          WHERE ${transactions.userId} = ${users.id}
          AND DATE(${transactions.date}) >= ${sixtyDaysAgo.toISOString().split('T')[0]}
        )`
      );

    const churned = churnedResult?.count || 0;

    const segments: UserSegment[] = [
      {
        segment: 'new_users',
        count: newUsers,
        percentage: (newUsers / totalUsers) * 100,
        description: 'Зарегистрировались за последние 30 дней',
      },
      {
        segment: 'active_users',
        count: activeUsers,
        percentage: (activeUsers / totalUsers) * 100,
        description: 'Активные пользователи (транзакция за последние 30 дней)',
      },
      {
        segment: 'power_users',
        count: powerUsers,
        percentage: (powerUsers / totalUsers) * 100,
        description: 'Мощные пользователи (50+ транзакций, активны)',
      },
      {
        segment: 'at_risk',
        count: atRisk,
        percentage: (atRisk / totalUsers) * 100,
        description: 'В зоне риска (неактивны 30-60 дней)',
      },
      {
        segment: 'churned',
        count: churned,
        percentage: (churned / totalUsers) * 100,
        description: 'Неактивные (60+ дней без транзакций)',
      },
    ];

    return {
      segments,
      totalUsers,
    };
  } catch (error) {
    logError('Failed to get user segments', error as Error);
    throw error;
  }
}

