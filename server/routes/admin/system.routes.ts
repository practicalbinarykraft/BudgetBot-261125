/**
 * Admin System Routes
 * 
 * Junior-Friendly Guide:
 * =====================
 * Эти роуты предоставляют информацию о здоровье системы для админ-панели.
 * 
 * Endpoints:
 * - GET /api/admin/system/health - полная информация о здоровье системы
 * 
 * Использование:
 *   import systemRouter from './admin/system.routes';
 *   app.use('/api/admin/system', requireAdmin, systemRouter);
 */

import { Router, Request, Response } from 'express';
import { requireAdmin, AdminRequest } from '../../middleware/admin-auth.middleware';
import { getSystemHealth } from '../../services/admin-system-health.service';
import { getErrorMessage } from '../../lib/errors';

const router = Router();

/**
 * GET /api/admin/system/health
 * 
 * Получает полную информацию о здоровье системы
 * 
 * Для джуна: Возвращает информацию о:
 * - API performance (uptime, response time, error rate)
 * - Database health (connections, slow queries, size)
 * - External services (Telegram, OpenAI, Redis)
 * - Background jobs (cron jobs)
 * - System resources (memory, CPU)
 * 
 * Response:
 * {
 *   api: {
 *     uptime: 86400,
 *     uptimePercent: 99.9,
 *     avgResponseTime: 120,
 *     errorRate: 0.1,
 *     requests24h: 45000
 *   },
 *   database: {
 *     status: 'healthy',
 *     connections: 10,
 *     maxConnections: 100,
 *     slowQueries: 2,
 *     size: 2.5
 *   },
 *   external: {
 *     telegram: { status: 'healthy', latency: 50 },
 *     openai: { status: 'healthy', latency: 200 },
 *     redis: { status: 'healthy' }
 *   },
 *   jobs: {
 *     currencyUpdate: { lastRun: '2026-01-07T10:00:00Z', status: 'success', nextRun: '2026-01-08T03:00:00Z' },
 *     hourlyBudgetNotifications: { lastRun: '2026-01-07T09:00:00Z', status: 'success', nextRun: '2026-01-07T10:00:00Z' },
 *     sessionCleanup: { lastRun: '2026-01-07T02:00:00Z', status: 'success', nextRun: '2026-01-08T02:00:00Z' }
 *   },
 *   system: {
 *     memory: { heapUsed: 150, heapTotal: 200, rss: 300, usagePercent: 75 },
 *     cpu: { loadAvg: [0.5, 0.6, 0.7] }
 *   },
 *   timestamp: '2026-01-07T10:00:00Z'
 * }
 */
router.get('/health', requireAdmin, async (req: AdminRequest, res: Response) => {
  try {
    const health = await getSystemHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;

