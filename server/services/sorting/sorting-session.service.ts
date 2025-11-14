import { db } from '../../db';
import { sortingProgress, sortingSessions, settings } from '@shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { format, subDays, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Создать или обновить сессию сортировки (атомарно)
 * 
 * Логика стриков:
 * - Если lastSessionDate = вчера → увеличить стрик
 * - Если lastSessionDate = сегодня → обновить очки текущей сессии
 * - Если пропуск > 1 день → сбросить стрик
 * 
 * ВАЖНО: Использует транзакцию для предотвращения race conditions
 */
export async function createOrUpdateSession(
  userId: number,
  clientDate: Date, // Текущее время клиента
  transactionsSorted: number
): Promise<{ success: boolean; currentStreak: number; totalPoints: number }> {
  const pointsEarned = transactionsSorted * 10; // 10 очков за транзакцию

  // Получить timezone пользователя
  const [userSettings] = await db
    .select()
    .from(settings)
    .where(eq(settings.userId, userId))
    .limit(1);

  const userTimezone = userSettings?.timezone || 'UTC';

  // Нормализовать дату по timezone пользователя (YYYY-MM-DD)
  const sessionDate = formatInTimeZone(clientDate, userTimezone, 'yyyy-MM-dd');

  // Использовать транзакцию для атомарности
  return await db.transaction(async (tx) => {
    // 1. UPSERT сессия (ON CONFLICT обновляет, иначе создает)
    await tx
      .insert(sortingSessions)
      .values({
        userId,
        sessionDate,
        transactionsSorted,
        pointsEarned,
      })
      .onConflictDoUpdate({
        target: [sortingSessions.userId, sortingSessions.sessionDate],
        set: {
          transactionsSorted: sql`${sortingSessions.transactionsSorted} + ${transactionsSorted}`,
          pointsEarned: sql`${sortingSessions.pointsEarned} + ${pointsEarned}`,
        },
      });

    // 2. Обновить прогресс (внутри той же транзакции)
    const result = await updateSortingProgressInTransaction(
      tx,
      userId,
      sessionDate,
      pointsEarned,
      transactionsSorted
    );

    return result;
  });
}

/**
 * Обновить общий прогресс пользователя (стрики, очки)
 * ВАЖНО: Вызывается внутри транзакции для атомарности
 */
async function updateSortingProgressInTransaction(
  tx: any, // Transaction context
  userId: number,
  sessionDate: string,
  pointsEarned: number,
  transactionsSorted: number
): Promise<{ success: boolean; currentStreak: number; totalPoints: number }> {
  // Получить или создать прогресс (атомарно через UPSERT)
  // Сначала пытаемся создать (ON CONFLICT DO NOTHING если уже существует)
  await tx
    .insert(sortingProgress)
    .values({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      totalPoints: 0,
      totalSorted: 0,
      lastSessionDate: null,
    })
    .onConflictDoNothing({ target: sortingProgress.userId });

  // Теперь получить прогресс (он точно существует) с блокировкой
  const [progress] = await tx
    .select()
    .from(sortingProgress)
    .where(eq(sortingProgress.userId, userId))
    .for('update') // Блокировка от concurrent updates
    .limit(1);

  if (!progress) {
    throw new Error('Failed to create or fetch sorting progress');
  }

  // Вычислить новый стрик
  let newStreak: number;

  if (!progress.lastSessionDate) {
    // Первая сессия (или прогресс только что создан)
    newStreak = 1;
  } else {
    const lastDate = parseISO(progress.lastSessionDate);
    const currentDate = parseISO(sessionDate);
    const yesterday = subDays(currentDate, 1);

    // Проверить: вчера ли была последняя сессия?
    const lastDateStr = format(lastDate, 'yyyy-MM-dd');
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    const currentDateStr = format(currentDate, 'yyyy-MM-dd');

    if (lastDateStr === yesterdayStr) {
      // Продолжение стрика
      newStreak = progress.currentStreak + 1;
    } else if (lastDateStr === currentDateStr) {
      // Та же дата - стрик не меняется
      newStreak = progress.currentStreak;
    } else {
      // Пропуск - сброс стрика
      newStreak = 1;
    }
  }

  // Новый рекорд стрика?
  const newLongestStreak = Math.max(progress.longestStreak, newStreak);
  const newTotalPoints = progress.totalPoints + pointsEarned;
  const newTotalSorted = progress.totalSorted + transactionsSorted;

  // Обновить прогресс
  await tx
    .update(sortingProgress)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      totalPoints: newTotalPoints,
      totalSorted: newTotalSorted,
      lastSessionDate: sessionDate,
      updatedAt: sql`NOW()`,
    })
    .where(eq(sortingProgress.userId, userId));

  return {
    success: true,
    currentStreak: newStreak,
    totalPoints: newTotalPoints,
  };
}
