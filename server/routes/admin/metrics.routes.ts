/**
 * Admin Metrics Routes
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти роуты возвращают метрики для админ-панели.
 * Метрики показывают состояние бизнеса: пользователи, активность, доходы.
 * 
 * Endpoints:
 * - GET /api/admin/metrics/hero - основные метрики (dashboard)
 * - GET /api/admin/metrics/growth - метрики роста
 * 
 * Использование:
 *   import metricsRouter from './admin/metrics.routes';
 *   app.use('/api/admin/metrics', requireAdmin, metricsRouter);
 */

import { Router, Request, Response } from 'express';
import { requireAdmin, AdminRequest } from '../../middleware/admin-auth.middleware';
import { getHeroMetrics, getGrowthMetrics, getRevenueMetrics, getCohortRetention, clearMetricsCache } from '../../services/admin-metrics.service';
import { getErrorMessage } from '../../lib/errors';

const router = Router();

// Test endpoint without auth to verify router is registered
router.get('/test', (req, res) => {
  res.json({ message: 'Metrics router is working!', path: req.path, url: req.url });
});

/**
 * GET /api/admin/metrics/hero
 * 
 * Получает основные метрики для dashboard
 * 
 * Для джуна: Это главные цифры, которые показывают на главной странице админ-панели.
 * Метрики кэшируются на 5 минут, чтобы не нагружать БД.
 * 
 * Response:
 * {
 *   totalUsers: { current, activeToday, activeThisWeek, activeThisMonth, change },
 *   revenue: { total, thisMonth, lastMonth, change, trend },
 *   transactions: { total, thisMonth, averagePerUser },
 *   engagement: { averageTransactionsPerUser, activeUserRate }
 * }
 */
router.get('/hero', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const metrics = await getHeroMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/metrics/growth
 * 
 * Получает метрики роста
 * 
 * Для джуна: Показывает как растет бизнес: новые пользователи,
 * активность, retention (возвращаемость пользователей).
 * 
 * Response:
 * {
 *   userGrowth: { mau, dau, wau },
 *   retention: { d1, d7, d30 },
 *   newUsers: { today, thisWeek, thisMonth, trend }
 * }
 */
router.get('/growth', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const metrics = await getGrowthMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/metrics/revenue
 * 
 * Получает детальную разбивку MRR
 * 
 * Для джуна: Показывает откуда берется MRR: новые пользователи,
 * расширение, сокращение, отток.
 * 
 * Response:
 * {
 *   mrr: { total, newMRR, expansionMRR, contractionMRR, churnedMRR },
 *   arr, arpu,
 *   churn: { userChurnRate, revenueChurnRate, netRevenueRetention }
 * }
 */
router.get('/revenue', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const metrics = await getRevenueMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/metrics/cohort-retention
 * 
 * Получает данные cohort retention для heatmap
 * 
 * Для джуна: Показывает сколько пользователей из каждой когорты
 * остаются активными через 1, 2, 3, 6, 12 месяцев.
 * 
 * Response:
 * [
 *   {
 *     cohortMonth: '2025-01',
 *     usersCount: 145,
 *     retention: { month0: 100, month1: 70, month2: 60, ... }
 *   },
 *   ...
 * ]
 */
router.get('/cohort-retention', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const data = await getCohortRetention();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * POST /api/admin/metrics/clear-cache
 * 
 * Очищает кэш метрик
 * 
 * Для джуна: Иногда нужно обновить метрики сразу (например, после
 * важных изменений). Этот endpoint очищает кэш.
 * 
 * Response:
 * { success: true }
 */
router.post('/clear-cache', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    clearMetricsCache();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;

