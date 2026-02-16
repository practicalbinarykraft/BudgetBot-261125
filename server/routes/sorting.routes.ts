import { Router } from 'express';
import { getSortingStats } from '../services/sorting/sorting-stats.service';
import { createOrUpdateSession } from '../services/sorting/sorting-session.service';
import { insertSortingSessionSchema } from '@shared/schema';
import type { User } from '@shared/schema';
import { logError } from '../lib/logger';

const router = Router();

/**
 * GET /api/sorting/stats
 * Получить статистику сортировки:
 * - Количество несортированных транзакций
 * - Текущий стрик
 * - Рекордный стрик
 * - Общие очки
 * - Всего отсортировано
 */
router.get('/stats', async (req, res) => {
  try {
    const user = req.user as User;
    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    const stats = await getSortingStats(user.id);
    res.json(stats);
  } catch (error) {
    logError('Get sorting stats error:', error);
    res.status(500).send('Failed to get sorting stats');
  }
});

/**
 * POST /api/sorting/session
 * Сохранить игровую сессию
 * Body: { transactionsSorted: number }
 * Дата берется из текущего времени сервера (нормализуется по timezone пользователя)
 */
router.post('/session', async (req, res) => {
  try {
    const user = req.user as User;
    if (!user) {
      return res.status(401).send('Unauthorized');
    }

    // Валидация входных данных
    const { transactionsSorted } = req.body;
    if (!transactionsSorted || typeof transactionsSorted !== 'number' || transactionsSorted < 0) {
      return res.status(400).json({ error: 'Invalid transactionsSorted value' });
    }

    // Использовать текущее время (сервис сам нормализует по timezone)
    const result = await createOrUpdateSession(user.id, new Date(), transactionsSorted);

    res.json(result);
  } catch (error) {
    logError('Create sorting session error:', error);
    res.status(500).send('Failed to create sorting session');
  }
});

export default router;
