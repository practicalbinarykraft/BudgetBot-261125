/**
 * Health Check Routes
 *
 * Provides health check endpoints for monitoring and load balancers.
 * Used by Docker healthcheck, Kubernetes probes, and monitoring tools.
 * Junior-Friendly: ~100 lines, clear health check patterns
 */

import { Router } from 'express';
import { db } from '../db';
import { isRedisAvailable, cache } from '../lib/redis';
import { metrics } from '../lib/metrics';
import { getAlertStatus } from '../lib/alerts';
import { getProviderOrder, getProviderNames, getProvider } from '../services/ocr/ocr-registry';
import { getSystemKey } from '../services/api-key-manager';
import os from 'os';

const router = Router();

/**
 * Get system metrics for monitoring
 */
function getSystemMetrics() {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000), // ms
      system: Math.round(cpuUsage.system / 1000), // ms
    },
    system: {
      loadAvg: os.loadavg().map(n => Math.round(n * 100) / 100),
      freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
      totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
      cpuCount: os.cpus().length,
    },
  };
}

/**
 * Basic health check
 * Returns 200 OK if server is running
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * Detailed health check
 * Checks database, Redis, and other dependencies
 */
router.get('/health/detailed', async (_req, res) => {
  const checks: {
    server: string;
    database: string;
    redis: string;
    timestamp: string;
    uptime: number;
    metrics: ReturnType<typeof getSystemMetrics>;
    version: string;
  } = {
    server: 'ok',
    database: 'checking',
    redis: 'checking',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    metrics: getSystemMetrics(),
    version: process.env.npm_package_version || 'unknown',
  };

  let isHealthy = true;

  // Check database connection
  try {
    await db.execute('SELECT 1');
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
    isHealthy = false;
  }

  // Check Redis connection (optional - not critical)
  try {
    const redisAvailable = await isRedisAvailable();
    checks.redis = redisAvailable ? 'ok' : 'not configured';
  } catch {
    checks.redis = 'not configured';
  }

  const status = isHealthy ? 200 : 503;
  res.status(status).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
  });
});

/**
 * Readiness probe
 * For Kubernetes - checks if app is ready to receive traffic
 */
router.get('/health/ready', async (_req, res) => {
  try {
    // Check if database is accessible
    await db.execute('SELECT 1');

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Liveness probe
 * For Kubernetes - checks if app is alive (always returns 200 if process is running)
 */
router.get('/health/live', (_req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Metrics endpoint
 * For monitoring dashboards (Grafana, Datadog, etc.)
 */
router.get('/health/metrics', async (_req, res) => {
  const systemMetrics = getSystemMetrics();
  const businessMetrics = metrics.getAll();

  // Get Redis stats if available
  let redisStats = null;
  try {
    redisStats = await cache.getStats();
  } catch {
    // Redis not available
  }

  res.status(200).json({
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    nodeVersion: process.version,
    pid: process.pid,
    ...systemMetrics,
    business: businessMetrics,
    redis: redisStats,
  });
});

/**
 * Alerts endpoint
 * Returns current alert status and any triggered alerts
 */
router.get('/health/alerts', (_req, res) => {
  const alertStatus = getAlertStatus();

  const status = alertStatus.healthy ? 200 : 503;
  res.status(status).json({
    timestamp: new Date().toISOString(),
    ...alertStatus,
  });
});

/**
 * OCR health check
 * Checks provider registration, system keys, and availability.
 * Does NOT call external APIs — only checks local config.
 */
router.get('/health/ocr', (_req, res) => {
  const providerOrder = getProviderOrder();
  const registeredNames = getProviderNames();

  // Check which providers are registered, available, and have system keys
  const providers = providerOrder.map(name => {
    const provider = getProvider(name);
    const registered = !!provider;
    const available = registered ? provider!.isAvailable() : false;

    let hasSystemKey = false;
    try {
      getSystemKey(name as any);
      hasSystemKey = true;
    } catch {
      // No system key configured
    }

    return { name, registered, available, hasSystemKey };
  });

  const providersConfigured = providers.filter(p => p.registered && p.available).length;
  const providersWithKeys = providers.filter(p => p.hasSystemKey).length;
  // 503 only when OCR subsystem is truly broken (no providers registered/available).
  // Missing system keys is NOT an error — users can still use BYOK keys.
  const healthy = providersConfigured > 0;

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    providerOrder,
    registeredProviders: registeredNames,
    providers,
    providersConfigured,
    providersWithKeys,
    timestamp: new Date().toISOString(),
  });
});

export default router;
