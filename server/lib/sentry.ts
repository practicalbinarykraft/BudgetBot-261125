/**
 * Sentry Error Tracking - Server
 *
 * Monitors and tracks errors in the Node.js backend.
 * Provides error reporting, performance monitoring, and debugging tools.
 *
 * Features:
 * - Error tracking with stack traces
 * - Performance monitoring (transactions)
 * - Request context (user, headers, body)
 * - Environment-based configuration
 * - Breadcrumbs for debugging
 *
 * @see https://docs.sentry.io/platforms/node/
 */

import * as Sentry from '@sentry/node';
import { env } from './env';
import { logInfo, logWarning } from './logger';

/**
 * Initialize Sentry for server-side error tracking
 *
 * Only initializes if SENTRY_DSN is set in environment.
 * Safe to call multiple times (won't re-initialize).
 */
export function initSentry(): void {
  const sentryDsn = process.env.SENTRY_DSN;

  // Skip if no DSN configured
  if (!sentryDsn) {
    if (env.NODE_ENV === 'production') {
      logWarning('Sentry DSN not configured in production');
    } else {
      logInfo('Sentry not configured (optional in development)');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment: env.NODE_ENV,

      // Performance Monitoring
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      // 10% in production, 100% in development

      // Error Sampling
      sampleRate: 1.0, // Capture 100% of errors

      // Release tracking (optional - set via CI/CD)
      // release: process.env.SENTRY_RELEASE || 'budgetbot@unknown',

      // Server name (for multi-instance deployments)
      serverName: process.env.HOSTNAME || 'budgetbot-server',

      // Integrations (Sentry v8 API)
      integrations: [
        // HTTP integration for request tracking
        Sentry.httpIntegration(),
      ],

      // Before sending events
      beforeSend(event, hint) {
        // Don't send errors in test environment
        if (env.NODE_ENV === 'test') {
          return null;
        }

        // Filter out sensitive data
        if (event.request) {
          // Remove sensitive headers
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
            delete event.request.headers['x-api-key'];
          }

          // Remove sensitive query params
          if (event.request.query_string && typeof event.request.query_string === 'string') {
            event.request.query_string = event.request.query_string
              .replace(/([?&])(token|key|secret|password)=[^&]*/gi, '$1$2=REDACTED');
          }
        }

        // Filter out common non-critical errors
        const error = hint.originalException as Error;
        if (error?.message) {
          // Ignore known non-critical errors
          const ignoredMessages = [
            'ECONNRESET',
            'ECONNREFUSED',
            'socket hang up',
            'Client closed socket',
          ];

          if (ignoredMessages.some(msg => error.message.includes(msg))) {
            return null; // Don't send to Sentry
          }
        }

        return event;
      },

      // Before sending breadcrumbs
      beforeBreadcrumb(breadcrumb) {
        // Filter sensitive data from breadcrumbs
        if (breadcrumb.category === 'http' && breadcrumb.data) {
          delete breadcrumb.data.authorization;
          delete breadcrumb.data.cookie;
        }

        return breadcrumb;
      },
    });

    logInfo('Sentry initialized successfully', {
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
  } catch (error) {
    logWarning('Failed to initialize Sentry', error as Error);
  }
}

/**
 * Capture an exception and send to Sentry
 *
 * @param error - Error object to capture
 * @param context - Additional context (user, tags, extra data)
 */
export function captureException(
  error: Error | unknown,
  context?: {
    user?: { id: string | number; email?: string; username?: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
): string | undefined {
  if (!process.env.SENTRY_DSN) {
    return undefined; // Sentry not configured
  }

  try {
    // Set context
    if (context?.user) {
      Sentry.setUser(context.user);
    }

    if (context?.tags) {
      Sentry.setTags(context.tags);
    }

    if (context?.extra) {
      Sentry.setExtras(context.extra);
    }

    // Capture exception
    const eventId = Sentry.captureException(error, {
      level: context?.level || 'error',
    });

    // Clear context
    Sentry.setUser(null);

    return eventId;
  } catch (err) {
    logWarning('Failed to capture exception in Sentry', err as Error);
    return undefined;
  }
}

/**
 * Capture a message and send to Sentry
 *
 * @param message - Message to log
 * @param level - Severity level
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
): string | undefined {
  if (!process.env.SENTRY_DSN) {
    return undefined;
  }

  try {
    if (context?.tags) {
      Sentry.setTags(context.tags);
    }

    if (context?.extra) {
      Sentry.setExtras(context.extra);
    }

    const eventId = Sentry.captureMessage(message, level);

    return eventId;
  } catch (err) {
    logWarning('Failed to capture message in Sentry', err as Error);
    return undefined;
  }
}

/**
 * Add breadcrumb for debugging
 *
 * @param breadcrumb - Breadcrumb data
 */
export function addBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: Sentry.SeverityLevel;
  data?: Record<string, any>;
}): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'custom',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context for error tracking
 *
 * @param user - User information
 */
export function setUser(user: {
  id: string | number;
  email?: string;
  username?: string;
}): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (!process.env.SENTRY_DSN) {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Start a new span for performance monitoring (Sentry v8)
 *
 * @param name - Span name
 * @param op - Operation type
 * @param callback - Function to execute within the span
 */
export function startSpan<T>(
  name: string,
  op: string = 'http.server',
  callback: () => T
): T {
  if (!process.env.SENTRY_DSN) {
    return callback();
  }

  return Sentry.startSpan({ name, op }, callback);
}

/**
 * Flush pending events to Sentry
 * Useful before process exit
 *
 * @param timeout - Timeout in milliseconds
 */
export async function flush(timeout: number = 2000): Promise<boolean> {
  if (!process.env.SENTRY_DSN) {
    return true;
  }

  try {
    return await Sentry.flush(timeout);
  } catch (err) {
    logWarning('Failed to flush Sentry events', err as Error);
    return false;
  }
}

// Export Sentry namespace for advanced usage
export { Sentry };
