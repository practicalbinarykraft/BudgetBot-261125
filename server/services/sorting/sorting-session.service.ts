import { sortingRepository } from '../../repositories/sorting.repository';
import { settingsRepository } from '../../repositories/settings.repository';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Создать или обновить сессию сортировки (атомарно)
 */
export async function createOrUpdateSession(
  userId: number,
  clientDate: Date, // Текущее время клиента
  transactionsSorted: number
): Promise<{ success: boolean; currentStreak: number; totalPoints: number }> {
  const pointsEarned = transactionsSorted * 10; // 10 очков за транзакцию

  // Получить timezone пользователя
  const userSettings = await settingsRepository.getSettingsByUserId(userId);
  const userTimezone = userSettings?.timezone || 'UTC';

  // Нормализовать дату по timezone пользователя (YYYY-MM-DD)
  const sessionDate = formatInTimeZone(clientDate, userTimezone, 'yyyy-MM-dd');

  return await sortingRepository.createOrUpdateSession(
    userId,
    sessionDate,
    transactionsSorted,
    pointsEarned
  );
}
