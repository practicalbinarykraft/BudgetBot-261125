/**
 * Security Headers Middleware
 *
 * Adds security headers to protect against common web vulnerabilities.
 * Junior-Friendly: ~35 lines, uses helmet with sensible defaults
 *
 * Headers added:
 * - X-Content-Type-Options: nosniff (prevents MIME sniffing)
 * - X-Frame-Options: DENY (prevents clickjacking)
 * - X-XSS-Protection: 0 (disabled, CSP is better)
 * - Strict-Transport-Security (HTTPS enforcement, production-only)
 * - Content-Security-Policy (XSS prevention)
 */

import helmet from 'helmet';
import { isProduction } from '../lib/env';

/**
 * Security headers middleware using helmet
 * Configured for API + SPA architecture
 */
export const securityHeaders = helmet({
  // Prevent clickjacking
  frameguard: { action: 'deny' },

  // Prevent MIME type sniffing
  noSniff: true,

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // HSTS - Enabled in production (HTTPS via nginx), disabled in development
  // maxAge: 1 year; includeSubDomains and preload for full HSTS coverage
  hsts: isProduction
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,

  // Cross-Origin headers for SPA assets
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,

  // Content Security Policy - relaxed for SPA with external resources
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://telegram.org"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "https://telegram.org"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: [
        "'self'",
        "https://budgetbot.online",
        "https://m.budgetbot.online",
        "https://api.anthropic.com",
        "https://fonts.googleapis.com",
        "https://fonts.gstatic.com",
        "wss:",
        "ws:",
        "http://localhost:*",
        "ws://localhost:*",
        "http://127.0.0.1:*", // Allow debug logging endpoint
        "ws://127.0.0.1:*"
      ],
      // Disable HTTPS upgrade for HTTP deployments
      upgradeInsecureRequests: null,
    },
  },

  // Disable DNS prefetching
  dnsPrefetchControl: { allow: false },

  // Prevent IE from executing downloads in site's context
  ieNoOpen: true,
});
