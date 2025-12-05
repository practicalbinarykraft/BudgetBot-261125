/**
 * Alert Rules Configuration
 *
 * Defines thresholds and rules for system alerts.
 * Junior-Friendly: ~60 lines, declarative config
 *
 * These rules are checked periodically and trigger notifications
 * when thresholds are exceeded.
 */

import { captureMessage } from './sentry';
import { logWarning, logError } from './logger';
import { metrics } from './metrics';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'fatal';

/**
 * Alert rule definition
 */
export interface AlertRule {
  name: string;
  description: string;
  severity: AlertSeverity;
  check: () => boolean;
  message: () => string;
}

/**
 * System alert rules
 */
export const alertRules: AlertRule[] = [
  {
    name: 'high_error_rate',
    description: 'API error rate exceeds 10%',
    severity: 'error',
    check: () => {
      const all = metrics.getAll();
      const total = all.counters['api_calls_total'] || 0;
      const errors = all.counters['api_calls_server_error'] || 0;
      if (total < 100) return false; // Not enough data
      return (errors / total) > 0.1;
    },
    message: () => {
      const all = metrics.getAll();
      const total = all.counters['api_calls_total'] || 0;
      const errors = all.counters['api_calls_server_error'] || 0;
      const rate = total > 0 ? ((errors / total) * 100).toFixed(1) : '0';
      return 'API error rate is ' + rate + '% (threshold: 10%)';
    },
  },
  {
    name: 'slow_api_response',
    description: 'Average API response time exceeds 2s',
    severity: 'warning',
    check: () => {
      const all = metrics.getAll();
      const timing = all.timings['api_response_time'];
      if (!timing || timing.count < 10) return false;
      return timing.avg > 2000;
    },
    message: () => {
      const all = metrics.getAll();
      const timing = all.timings['api_response_time'];
      return 'Average API response time is ' + (timing?.avg || 0) + 'ms (threshold: 2000ms)';
    },
  },
  {
    name: 'high_memory_usage',
    description: 'Memory usage exceeds 80% of heap',
    severity: 'warning',
    check: () => {
      const mem = process.memoryUsage();
      return (mem.heapUsed / mem.heapTotal) > 0.8;
    },
    message: () => {
      const mem = process.memoryUsage();
      const usage = ((mem.heapUsed / mem.heapTotal) * 100).toFixed(1);
      return 'Memory usage is ' + usage + '% (threshold: 80%)';
    },
  },
];

/**
 * Check all alert rules and trigger if needed
 */
export function checkAlerts(): { triggered: AlertRule[]; ok: AlertRule[] } {
  const triggered: AlertRule[] = [];
  const ok: AlertRule[] = [];

  for (const rule of alertRules) {
    try {
      if (rule.check()) {
        triggered.push(rule);

        // Log and send to Sentry
        const message = rule.message();
        
        if (rule.severity === 'error' || rule.severity === 'fatal') {
          logError('Alert triggered: ' + rule.name, new Error(message));
          captureMessage(message, rule.severity, {
            tags: { alert: rule.name },
          });
        } else {
          logWarning('Alert triggered: ' + rule.name, { message });
        }
      } else {
        ok.push(rule);
      }
    } catch (error) {
      logError('Alert check failed: ' + rule.name, error);
    }
  }

  return { triggered, ok };
}

/**
 * Get alert status summary
 */
export function getAlertStatus(): {
  healthy: boolean;
  alerts: { name: string; severity: AlertSeverity; message: string }[];
} {
  const { triggered } = checkAlerts();

  return {
    healthy: triggered.length === 0,
    alerts: triggered.map(rule => ({
      name: rule.name,
      severity: rule.severity,
      message: rule.message(),
    })),
  };
}
