/**
 * Telegram Update Deduplication
 * 
 * Предотвращает обработку одного и того же обновления дважды
 * (например, если и прод, и локалка получают одно сообщение)
 * 
 * Junior-Friendly Guide:
 * =====================
 * Telegram отправляет каждому серверу одно и то же обновление.
 * Если оба сервера обрабатывают его, транзакция создается дважды.
 * 
 * Решение: сохраняем update_id обработанных обновлений и пропускаем дубликаты.
 */

import { logWarning } from '../../lib/logger';

// In-memory хранилище обработанных update_id
// В production лучше использовать Redis для распределенных систем
const processedUpdates = new Set<number>();

// Очистка старых update_id (Telegram гарантирует, что update_id монотонно возрастают)
// Очищаем update_id старше 1 часа (примерно 3600 обновлений при 1 обновлении в секунду)
const MAX_STORED_UPDATES = 10000;
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 час

/**
 * Проверить, было ли обновление уже обработано
 */
export function isUpdateProcessed(updateId: number): boolean {
  // Периодическая очистка старых update_id
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    cleanupOldUpdates(updateId);
    lastCleanup = now;
  }
  
  return processedUpdates.has(updateId);
}

/**
 * Отметить обновление как обработанное
 */
export function markUpdateProcessed(updateId: number): void {
  processedUpdates.add(updateId);
  
  // Если хранилище слишком большое, очищаем старые
  if (processedUpdates.size > MAX_STORED_UPDATES) {
    cleanupOldUpdates(updateId);
  }
}

/**
 * Очистить старые update_id
 * 
 * Telegram гарантирует, что update_id монотонно возрастают,
 * поэтому мы можем удалить все update_id меньше текущего минус порог
 */
function cleanupOldUpdates(currentUpdateId: number): void {
  const threshold = currentUpdateId - MAX_STORED_UPDATES;
  let removed = 0;
  
  for (const id of Array.from(processedUpdates)) {
    if (id < threshold) {
      processedUpdates.delete(id);
      removed++;
    }
  }
  
  if (removed > 0) {
    logWarning('Cleaned up old Telegram update IDs', {
      removed,
      remaining: processedUpdates.size,
      threshold,
      currentUpdateId,
    });
  }
}

/**
 * Получить статистику дедупликации (для диагностики)
 */
export function getDeduplicationStats(): {
  processedCount: number;
  oldestUpdateId: number | null;
  newestUpdateId: number | null;
} {
  if (processedUpdates.size === 0) {
    return {
      processedCount: 0,
      oldestUpdateId: null,
      newestUpdateId: null,
    };
  }
  
  const ids = Array.from(processedUpdates).sort((a, b) => a - b);
  return {
    processedCount: processedUpdates.size,
    oldestUpdateId: ids[0],
    newestUpdateId: ids[ids.length - 1],
  };
}
