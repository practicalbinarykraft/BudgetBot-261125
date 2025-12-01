/**
 * Sentry Error Tracking - Client
 *
 * Monitors and tracks errors in the React frontend.
 * Provides error reporting, performance monitoring, and session replay.
 *
 * Features:
 * - Error tracking with stack traces
 * - Performance monitoring (page loads, API calls)
 * - Session replay for debugging
 * - User context tracking
 * - Breadcrumbs for user actions
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/react/
 */

import * as Sentry from '@sentry/react';
import { env, features } from './env';

/**
 * Initialize Sentry for client-side error tracking
 *
 * Only initializes if VITE_SENTRY_DSN is set and features.sentry is enabled.
 * Safe to call multiple times (won't re-initialize).
 */
export function initSentry(): void {
  // Skip if Sentry not configured
  if (!features.sentry || !env.VITE_SENTRY_DSN) {
    if (env.DEV) {
      console.log('Sentry not configured (optional in development)');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: env.VITE_SENTRY_DSN,
      environment: env.MODE,

      // Performance Monitoring (Sentry v8 API)
      integrations: [
        // Browser tracing for performance monitoring
        Sentry.browserTracingIntegration(),

        // Session Replay for visual debugging
        Sentry.replayIntegration({
          // Mask all text and sensitive data by default
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Trace propagation targets
      tracePropagationTargets: [
        'localhost',
        /^\//,  // Relative URLs
        env.VITE_API_URL || window.location.origin,
      ],

      // Performance sampling
      tracesSampleRate: env.PROD ? 0.1 : 1.0, // 10% in prod, 100% in dev

      // Session replay sampling
      replaysSessionSampleRate: env.PROD ? 0.1 : 1.0,
      replaysOnErrorSampleRate: 1.0, // Always replay on error

      // Release tracking (optional - set via CI/CD)
      // release: import.meta.env.VITE_SENTRY_RELEASE || 'budgetbot@unknown',

      // Before sending events
      beforeSend(event, hint) {
        // Don't send events in test environment
        if (env.MODE === 'test') {
          return null;
        }

        // Filter out non-error events in production
        if (env.PROD && event.level && !['error', 'fatal'].includes(event.level)) {
          return null;
        }

        // Filter sensitive data
        if (event.request) {
          // Remove sensitive query params
          if (event.request.query_string && typeof event.request.query_string === 'string') {
            event.request.query_string = event.request.query_string
              .replace(/([?&])(token|key|secret|password)=[^&]*/gi, '$1$2=REDACTED');
          }

          // Remove cookies
          if (event.request.headers) {
            delete event.request.headers.cookie;
          }
        }

        // Filter out known non-critical errors
        const error = hint.originalException as Error;
        if (error?.message) {
          const ignoredMessages = [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            'Failed to fetch',
            'NetworkError',
            'AbortError',
          ];

          if (ignoredMessages.some(msg => error.message.includes(msg))) {
            return null; // Don't send to Sentry
          }
        }

        // In development, also log to console
        if (env.DEV) {
          console.error('Sentry event:', event);
          console.error('Original exception:', hint.originalException);
        }

        return event;
      },

      // Before sending breadcrumbs
      beforeBreadcrumb(breadcrumb) {
        // Filter sensitive data from breadcrumbs
        if (breadcrumb.category === 'fetch' && breadcrumb.data) {
          // Remove sensitive headers
          delete breadcrumb.data.authorization;
          delete breadcrumb.data.cookie;
        }

        // Filter console breadcrumbs in production
        if (env.PROD && breadcrumb.category === 'console') {
          return null;
        }

        return breadcrumb;
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',

        // Random network errors
        'NetworkError',
        'Network request failed',
        'Failed to fetch',

        // React hydration errors (usually not actionable)
        'Hydration failed',
      ],

      // Deny URLs (don't track errors from these sources)
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
      ],
    });

    if (env.DEV) {
      console.log('✅ Sentry initialized successfully', {
        environment: env.MODE,
        tracesSampleRate: env.PROD ? 0.1 : 1.0,
        replayEnabled: true,
      });
    }
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
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
  if (!features.sentry) {
    return undefined;
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
    console.error('Failed to capture exception in Sentry:', err);
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
  if (!features.sentry) {
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
    console.error('Failed to capture message in Sentry:', err);
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
  if (!features.sentry) {
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
} | null): void {
  if (!features.sentry) {
    return;
  }

  Sentry.setUser(user);
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
  op: string = 'navigation',
  callback: () => T
): T {
  if (!features.sentry) {
    return callback();
  }

  return Sentry.startSpan({ name, op }, callback);
}

// Export Sentry namespace for advanced usage
export { Sentry };
