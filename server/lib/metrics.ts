/**
 * Business Metrics Module
 *
 * Tracks key business metrics for monitoring dashboards.
 * Junior-Friendly: ~80 lines, simple counter/gauge patterns
 *
 * Usage:
 *   metrics.incrementCounter('transactions_created');
 *   metrics.recordTiming('api_response_time', 150);
 */

import { addBreadcrumb } from './sentry';
import { logInfo } from './logger';

// In-memory metrics (reset on restart)
// For production, use Redis or Prometheus
const counters = new Map<string, number>();
const gauges = new Map<string, number>();
const timings = new Map<string, number[]>();

/**
 * Business metrics service
 */
export const metrics = {
  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value = 1): void {
    const current = counters.get(name) || 0;
    counters.set(name, current + value);

    // Log significant milestones
    const newValue = current + value;
    if (newValue % 100 === 0) {
      logInfo('Metric milestone', { name, value: newValue });
    }
  },

  /**
   * Set a gauge metric (current value)
   */
  setGauge(name: string, value: number): void {
    gauges.set(name, value);
  },

  /**
   * Record a timing metric (ms)
   */
  recordTiming(name: string, durationMs: number): void {
    const values = timings.get(name) || [];
    values.push(durationMs);

    // Keep last 100 values
    if (values.length > 100) {
      values.shift();
    }
    timings.set(name, values);

    // Alert on slow operations
    if (durationMs > 5000) {
      addBreadcrumb({
        message: 'Slow operation detected',
        category: 'performance',
        level: 'warning',
        data: { name, durationMs },
      });
    }
  },

  /**
   * Get all metrics for reporting
   */
  getAll(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    timings: Record<string, { avg: number; max: number; min: number; count: number }>;
  } {
    const timingStats: Record<string, { avg: number; max: number; min: number; count: number }> = {};

    timings.forEach((values, name) => {
      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        timingStats[name] = {
          avg: Math.round(sum / values.length),
          max: Math.max(...values),
          min: Math.min(...values),
          count: values.length,
        };
      }
    });

    return {
      counters: Object.fromEntries(counters),
      gauges: Object.fromEntries(gauges),
      timings: timingStats,
    };
  },

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    counters.clear();
    gauges.clear();
    timings.clear();
  },

  /**
   * Track an API endpoint call
   */
  trackApiCall(method: string, statusCode: number, durationMs: number): void {
    // Counter for total calls
    this.incrementCounter('api_calls_total');
    this.incrementCounter('api_calls_' + method.toLowerCase());

    // Counter for status codes
    if (statusCode >= 200 && statusCode < 300) {
      this.incrementCounter('api_calls_success');
    } else if (statusCode >= 400 && statusCode < 500) {
      this.incrementCounter('api_calls_client_error');
    } else if (statusCode >= 500) {
      this.incrementCounter('api_calls_server_error');
    }

    // Timing
    this.recordTiming('api_response_time', durationMs);
  },

  /**
   * Track a business event
   */
  trackEvent(event: string, data?: Record<string, unknown>): void {
    this.incrementCounter('event_' + event);

    addBreadcrumb({
      message: 'Business event: ' + event,
      category: 'business',
      level: 'info',
      data,
    });
  },
};

// Predefined business events
export const BusinessEvents = {
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login',
  TRANSACTION_CREATED: 'transaction_created',
  BUDGET_EXCEEDED: 'budget_exceeded',
  WALLET_CREATED: 'wallet_created',
  AI_REQUEST: 'ai_request',
  TELEGRAM_MESSAGE: 'telegram_message',
} as const;
