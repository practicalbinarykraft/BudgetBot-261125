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
 * - Strict-Transport-Security (HTTPS enforcement)
 * - Content-Security-Policy (XSS prevention)
 */

import helmet from 'helmet';

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

  // HSTS - enforce HTTPS (1 year)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },

  // Content Security Policy - relaxed for API
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // For Swagger UI
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.anthropic.com"],
    },
  },

  // Disable DNS prefetching
  dnsPrefetchControl: { allow: false },

  // Prevent IE from executing downloads in site's context
  ieNoOpen: true,
});
