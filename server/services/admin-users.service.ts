/**
 * Admin Users Service
 * 
 * Junior-Friendly Guide:
 * =====================
 * Этот сервис предоставляет функции для работы с пользователями в админ-панели.
 * Админы могут просматривать список пользователей, их детали, транзакции и т.д.
 * 
 * Использование:
 *   import { getUsersList, getUserDetails } from './admin-users.service';
 *   const users = await getUsersList({ page: 1, limit: 20 });
 */

import { db } from '../db';
import { users, transactions, wallets, categories, budgets } from '@shared/schema';
import { sql, eq, and, or, like, ilike, count, desc, asc } from 'drizzle-orm';
import { logError } from '../lib/logger';
import { getCreditBalance } from './credits.service';

/**
 * Параметры для получения списка пользователей
 */
export interface GetUsersListParams {
  page?: number;
  limit?: number;
  search?: string; // Поиск по имени или email
  sortBy?: 'created_at' | 'name' | 'email';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Результат получения списка пользователей
 */
export interface UsersListResult {
  users: Array<{
    id: number;
    email: string | null;
    name: string;
    telegramId: string | null;
    telegramUsername: string | null;
    createdAt: Date;
    lastActiveAt: Date | null;
    transactionsCount: number;
    walletsCount: number;
    totalIncome: number;
    totalExpenses: number;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Получает список пользователей с фильтрами и пагинацией
 * 
 * Для джуна: Этот метод делает сложный SQL-запрос с JOIN'ами,
 * чтобы получить пользователей вместе со статистикой (количество транзакций,
 * доходы, расходы). Все это в одном запросе для производительности.
 */
export async function getUsersList(params: GetUsersListParams = {}): Promise<UsersListResult> {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    // Валидация параметров
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit)); // Максимум 100 на страницу
    const offset = (pageNum - 1) * limitNum;

    // Строим условия WHERE
    const conditions = [];

    // Поиск по имени или email
    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.telegramUsername, `%${search}%`)
        )!
      );
    }

    // Подсчет общего количества (для пагинации)
    const countQuery = db
      .select({ count: count() })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .$dynamic();

    const [countResult] = await countQuery;
    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limitNum);

    // Основной запрос с JOIN'ами для статистики
    let query = db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        telegramId: users.telegramId,
        telegramUsername: users.telegramUsername,
        createdAt: users.createdAt,
        // Статистика через подзапросы
        transactionsCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${transactions}
          WHERE ${transactions.userId} = ${users.id}
        )`,
        walletsCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${wallets}
          WHERE ${wallets.userId} = ${users.id}
        )`,
        totalIncome: sql<number>`COALESCE((
          SELECT SUM(${transactions.amountUsd})::numeric
          FROM ${transactions}
          WHERE ${transactions.userId} = ${users.id}
          AND ${transactions.type} = 'income'
        ), 0)`,
        totalExpenses: sql<number>`COALESCE((
          SELECT SUM(${transactions.amountUsd})::numeric
          FROM ${transactions}
          WHERE ${transactions.userId} = ${users.id}
          AND ${transactions.type} = 'expense'
        ), 0)`,
        lastActiveAt: sql<Date | null>`(
          SELECT MAX(${transactions.date})
          FROM ${transactions}
          WHERE ${transactions.userId} = ${users.id}
        )`,
      })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .$dynamic();

    // Сортировка
    const sortColumn = {
      created_at: users.createdAt,
      name: users.name,
      email: users.email,
    }[sortBy] || users.createdAt;

    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    // Пагинация
    query = query.limit(limitNum).offset(offset);

    const usersList = await query;

    return {
      users: usersList.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
        transactionsCount: user.transactionsCount,
        walletsCount: user.walletsCount,
        totalIncome: parseFloat(user.totalIncome.toString()),
        totalExpenses: parseFloat(user.totalExpenses.toString()),
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  } catch (error) {
    logError('Failed to get users list', error as Error, params);
    throw error;
  }
}

/**
 * Детальная информация о пользователе
 */
export interface UserDetails {
  id: number;
  email: string | null;
  name: string;
  telegramId: string | null;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  telegramPhotoUrl: string | null;
  createdAt: Date;
  stats: {
    transactionsCount: number;
    walletsCount: number;
    categoriesCount: number;
    budgetsCount: number;
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    lastActiveAt: Date | null;
  };
  credits: {
    totalGranted: number;
    totalUsed: number;
    messagesRemaining: number;
  };
}

/**
 * Получает детальную информацию о пользователе
 */
export async function getUserDetails(userId: number): Promise<UserDetails | null> {
  try {
    console.error('[DEBUG] getUserDetails entry', { userId });
    // Получаем основную информацию о пользователе
    // Явно указываем поля, чтобы избежать ошибок с отсутствующими столбцами
    console.error('[DEBUG] Before db.select users query', { userId });
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        telegramId: users.telegramId,
        telegramUsername: users.telegramUsername,
        telegramFirstName: users.telegramFirstName,
        telegramPhotoUrl: users.telegramPhotoUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    console.error('[DEBUG] After db.select users query', { userId, hasUser: !!user });

    if (!user) {
      return null;
    }

    // Получаем статистику
    const [transactionsCountResult] = await db
      .select({ count: count() })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    const [walletsCountResult] = await db
      .select({ count: count() })
      .from(wallets)
      .where(eq(wallets.userId, userId));

    const [categoriesCountResult] = await db
      .select({ count: count() })
      .from(categories)
      .where(eq(categories.userId, userId));

    const [budgetsCountResult] = await db
      .select({ count: count() })
      .from(budgets)
      .where(eq(budgets.userId, userId));

    const [incomeResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amountUsd})::numeric, 0)`,
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, 'income')));

    const [expensesResult] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amountUsd})::numeric, 0)`,
      })
      .from(transactions)
      .where(and(eq(transactions.userId, userId), eq(transactions.type, 'expense')));

    const [lastActiveResult] = await db
      .select({
        lastActive: sql<Date | null>`MAX(${transactions.date})`,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    // Получаем информацию о кредитах с обработкой ошибок
    let creditsBalance: { totalGranted: number; totalUsed: number; messagesRemaining: number };
    try {
      console.error('[DEBUG] getUserDetails - Calling getCreditBalance for user:', userId);
      const balanceResult = await getCreditBalance(userId);
      console.error('[DEBUG] getUserDetails balanceResult:', JSON.stringify(balanceResult));
      console.error('[DEBUG] getUserDetails balanceResult type:', typeof balanceResult);
      console.error('[DEBUG] getUserDetails balanceResult keys:', balanceResult ? Object.keys(balanceResult) : 'null');
      
      // Убеждаемся что результат валидный
      if (balanceResult && typeof balanceResult === 'object' && 'messagesRemaining' in balanceResult) {
        creditsBalance = {
          totalGranted: Number(balanceResult.totalGranted) || 0,
          totalUsed: Number(balanceResult.totalUsed) || 0,
          messagesRemaining: Number(balanceResult.messagesRemaining) || 0,
        };
      } else {
        console.error('[DEBUG] getUserDetails - Invalid balanceResult, using defaults');
        creditsBalance = {
          totalGranted: 0,
          totalUsed: 0,
          messagesRemaining: 0,
        };
      }
    } catch (error) {
      console.error('[DEBUG] getUserDetails ERROR getting credits:', error);
      console.error('[DEBUG] getUserDetails ERROR stack:', error instanceof Error ? error.stack : 'no stack');
      // Если не удалось получить кредиты, используем значения по умолчанию
      creditsBalance = {
        totalGranted: 0,
        totalUsed: 0,
        messagesRemaining: 0,
      };
    }
    
    console.error('[DEBUG] getUserDetails final creditsBalance:', JSON.stringify(creditsBalance));

    const result = {
      id: user.id,
      email: user.email,
      name: user.name,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      telegramFirstName: user.telegramFirstName,
      telegramPhotoUrl: user.telegramPhotoUrl,
      createdAt: user.createdAt,
      stats: {
        transactionsCount: transactionsCountResult?.count || 0,
        walletsCount: walletsCountResult?.count || 0,
        categoriesCount: categoriesCountResult?.count || 0,
        budgetsCount: budgetsCountResult?.count || 0,
        totalIncome: parseFloat(incomeResult?.total?.toString() || '0'),
        totalExpenses: parseFloat(expensesResult?.total?.toString() || '0'),
        balance: parseFloat(incomeResult?.total?.toString() || '0') - parseFloat(expensesResult?.total?.toString() || '0'),
        lastActiveAt: lastActiveResult?.lastActive || null,
      },
      credits: {
        totalGranted: creditsBalance.totalGranted,
        totalUsed: creditsBalance.totalUsed,
        messagesRemaining: creditsBalance.messagesRemaining,
      },
    };
    console.error('[DEBUG] getUserDetails returning result:', { 
      userId,
      hasStats: !!result.stats,
      statsKeys: result.stats ? Object.keys(result.stats) : [],
      hasCredits: !!result.credits,
      creditsKeys: result.credits ? Object.keys(result.credits) : [],
      creditsValue: result.credits,
      creditsBalanceValue: creditsBalance
    });
    console.error('[DEBUG] getUserDetails full result JSON:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[DEBUG] Error in getUserDetails', { 
      userId,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined 
    });
    logError('Failed to get user details', error as Error, { userId });
    throw error;
  }
}

/**
 * Получает транзакции пользователя с фильтрами
 */
export interface GetUserTransactionsParams {
  userId: number;
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  sortBy?: 'date' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface UserTransactionsResult {
  transactions: Array<{
    id: number;
    date: string;
    type: string;
    amount: string;
    amountUsd: string;
    description: string;
    currency: string;
    category: string | null;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getUserTransactions(params: GetUserTransactionsParams): Promise<UserTransactionsResult> {
  try {
    const {
      userId,
      page = 1,
      limit = 50,
      type,
      sortBy = 'date',
      sortOrder = 'desc',
    } = params;

    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const offset = (pageNum - 1) * limitNum;

    // Условия WHERE
    const conditions = [eq(transactions.userId, userId)];
    if (type) {
      conditions.push(eq(transactions.type, type));
    }

    // Подсчет общего количества
    const [countResult] = await db
      .select({ count: count() })
      .from(transactions)
      .where(and(...conditions));

    const total = countResult?.count || 0;
    const totalPages = Math.ceil(total / limitNum);

    // Основной запрос
    let query = db
      .select({
        id: transactions.id,
        date: transactions.date,
        type: transactions.type,
        amount: transactions.amount,
        amountUsd: transactions.amountUsd,
        description: transactions.description,
        currency: transactions.currency,
        category: transactions.category,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(and(...conditions))
      .$dynamic();

    // Сортировка
    const sortColumn = sortBy === 'amount' ? transactions.amountUsd : transactions.date;
    if (sortOrder === 'asc') {
      query = query.orderBy(asc(sortColumn));
    } else {
      query = query.orderBy(desc(sortColumn));
    }

    // Пагинация
    query = query.limit(limitNum).offset(offset);

    const transactionsList = await query;

    return {
      transactions: transactionsList.map(t => ({
        id: t.id,
        date: t.date,
        type: t.type,
        amount: t.amount,
        amountUsd: t.amountUsd,
        description: t.description,
        currency: t.currency || 'USD',
        category: t.category,
        createdAt: t.createdAt,
      })),
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    };
  } catch (error) {
    logError('Failed to get user transactions', error as Error, params);
    throw error;
  }
}

/**
 * Timeline событий пользователя
 */
export interface UserTimelineEvent {
  id: number;
  type: 'signup' | 'transaction' | 'wallet' | 'budget' | 'category' | 'login';
  action: string;
  description: string;
  date: Date;
  metadata?: Record<string, any>;
}

export async function getUserTimeline(userId: number, limit: number = 50): Promise<UserTimelineEvent[]> {
  try {
    const events: UserTimelineEvent[] = [];

    // Событие регистрации
    const [user] = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user) {
      events.push({
        id: 0,
        type: 'signup',
        action: 'signup',
        description: 'User registered',
        date: user.createdAt,
      });
    }

    // Первая транзакция
    const [firstTransaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(asc(transactions.date))
      .limit(1);

    if (firstTransaction) {
      events.push({
        id: firstTransaction.id,
        type: 'transaction',
        action: 'first_transaction',
        description: `First ${firstTransaction.type}: ${firstTransaction.description}`,
        date: new Date(firstTransaction.date),
        metadata: {
          amount: firstTransaction.amountUsd,
          type: firstTransaction.type,
        },
      });
    }

    // Последние транзакции (для timeline)
    const recentTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.date))
      .limit(limit);

    recentTransactions.forEach(t => {
      events.push({
        id: t.id,
        type: 'transaction',
        action: 'transaction_created',
        description: `${t.type}: ${t.description} - ${t.amountUsd} USD`,
        date: new Date(t.date),
        metadata: {
          amount: t.amountUsd,
          type: t.type,
          category: t.category,
        },
      });
    });

    // Сортируем по дате (новые сначала)
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    return events.slice(0, limit);
  } catch (error) {
    logError('Failed to get user timeline', error as Error, { userId });
    throw error;
  }
}

