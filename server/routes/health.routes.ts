/**
 * Health Check Routes
 *
 * Provides health check endpoints for monitoring and load balancers.
 * Used by Docker healthcheck, Kubernetes probes, and monitoring tools.
 */

import { Router } from 'express';
import { db } from '../db';

const router = Router();

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
 * Checks database connection and other dependencies
 */
router.get('/health/detailed', async (_req, res) => {
  const checks = {
    server: 'ok',
    database: 'checking',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || 'unknown',
  };

  try {
    // Check database connection
    await db.execute('SELECT 1');
    checks.database = 'ok';

    res.status(200).json({
      status: 'healthy',
      checks,
    });
  } catch (error) {
    checks.database = 'error';

    res.status(503).json({
      status: 'unhealthy',
      checks,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
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

export default router;
