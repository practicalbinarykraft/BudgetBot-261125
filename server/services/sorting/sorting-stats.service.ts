import { db } from '../../db';
import { transactions, personalTags, sortingProgress } from '@shared/schema';
import { eq, and, or, isNull } from 'drizzle-orm';

/**
 * Подсчет несортированных транзакций для пользователя
 * 
 * Транзакция считается несортированной если:
 * - personalTagId = NULL
 * - personalTagId = "Неопределена" (дефолтный тег)
 * - financialType = NULL
 */
export async function getUnsortedCount(userId: number): Promise<number> {
  // Найти тег "Неопределена"
  const undefinedTag = await db
    .select()
    .from(personalTags)
    .where(
      and(
        eq(personalTags.userId, userId),
        eq(personalTags.name, 'Неопределена')
      )
    )
    .limit(1);

  const undefinedTagId = undefinedTag[0]?.id;

  const orConditions = [
    isNull(transactions.personalTagId),
    isNull(transactions.financialType)
  ];
  
  if (undefinedTagId !== undefined) {
    orConditions.push(eq(transactions.personalTagId, undefinedTagId));
  }

  // Подсчитать несортированные транзакции
  const results = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'expense'),
        or(...orConditions)
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
