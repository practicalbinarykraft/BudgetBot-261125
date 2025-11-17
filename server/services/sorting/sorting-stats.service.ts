import { db } from '../../db';
import { transactions, sortingProgress } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Подсчет несортированных транзакций для пользователя
 * 
 * Транзакция считается несортированной если:
 * - financialType = NULL (personalTagId and categoryId are optional secondary classifications)
 */
export async function getUnsortedCount(userId: number): Promise<number> {
  // Подсчитать несортированные транзакции (только financialType=NULL)
  const results = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        isNull(transactions.financialType)
      )
    );

  return results.length;
}

/**
 * Получить полную статистику сортировки для пользователя
 */
export async function getSortingStats(userId: number) {
  // Получить количество несортированных транзакций
  const unsortedCount = await getUnsortedCount(userId);

  // Получить прогресс игры (если существует)
  const [progress] = await db
    .select()
    .from(sortingProgress)
    .where(eq(sortingProgress.userId, userId))
    .limit(1);

  // Если записи нет - вернуть дефолтные значения
  if (!progress) {
    return {
      unsortedCount,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      totalSorted: 0,
      lastSessionDate: null,
    };
  }

  return {
    unsortedCount,
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    totalPoints: progress.totalPoints,
    totalSorted: progress.totalSorted,
    lastSessionDate: progress.lastSessionDate,
  };
}
