/**
 * Admin Analytics Routes
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти роуты предоставляют аналитику для админ-панели:
 * - Funnel Analysis: воронка конверсии
 * - Feature Adoption: использование фич
 * - User Segments: сегменты пользователей
 * 
 * Endpoints:
 * - GET /api/admin/analytics/funnel - воронка конверсии
 * - GET /api/admin/analytics/feature-adoption - использование фич
 * - GET /api/admin/analytics/user-segments - сегменты пользователей
 * 
 * Использование:
 *   import analyticsRouter from './admin/analytics.routes';
 *   app.use('/api/admin/analytics', requireAdmin, analyticsRouter);
 */

import { Router, Request, Response } from 'express';
import { requireAdmin, AdminRequest } from '../../middleware/admin-auth.middleware';
import {
  getFunnelAnalysis,
  getFeatureAdoption,
  getUserSegments,
} from '../../services/admin-analytics.service';
import { getErrorMessage } from '../../lib/errors';

const router = Router();

/**
 * GET /api/admin/analytics/funnel
 * 
 * Получает воронку конверсии пользователей
 * 
 * Для джуна: Воронка показывает сколько пользователей прошло каждый шаг:
 * signup -> first_transaction -> create_wallet -> create_category -> create_budget
 * 
 * Response:
 * {
 *   steps: [
 *     { step: 'signup', count: 100, conversionRate: 100, avgTimeToComplete: 0 },
 *     { step: 'first_transaction', count: 80, conversionRate: 80, avgTimeToComplete: 2.5 },
 *     ...
 *   ],
 *   totalUsers: 100,
 *   overallConversion: 40
 * }
 */
router.get('/funnel', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const funnel = await getFunnelAnalysis();
    res.json(funnel);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/analytics/feature-adoption
 * 
 * Получает статистику использования фич
 * 
 * Для джуна: Показывает сколько пользователей используют каждую фичу
 * и насколько активно они её используют.
 * 
 * Response:
 * {
 *   features: [
 *     {
 *       feature: 'transactions',
 *       usersCount: 100,
 *       adoptionRate: 80,
 *       totalUsage: 5000,
 *       avgUsagePerUser: 50
 *     },
 *     ...
 *   ],
 *   totalUsers: 125
 * }
 */
router.get('/feature-adoption', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const adoption = await getFeatureAdoption();
    res.json(adoption);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

/**
 * GET /api/admin/analytics/user-segments
 * 
 * Получает сегменты пользователей
 * 
 * Для джуна: Разделяет пользователей на группы по поведению:
 * - new_users: новые пользователи
 * - active_users: активные
 * - power_users: мощные пользователи
 * - at_risk: в зоне риска
 * - churned: неактивные
 * 
 * Response:
 * {
 *   segments: [
 *     {
 *       segment: 'new_users',
 *       count: 20,
 *       percentage: 16,
 *       description: 'Зарегистрировались за последние 30 дней'
 *     },
 *     ...
 *   ],
 *   totalUsers: 125
 * }
 */
router.get('/user-segments', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const segments = await getUserSegments();
    res.json(segments);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;

