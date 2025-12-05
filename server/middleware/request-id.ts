/**
 * Request ID Middleware
 *
 * Adds unique request ID to each request for tracing.
 * Junior-Friendly: ~25 lines, single responsibility
 *
 * Features:
 * - Generates UUID v4 for each request
 * - Respects existing X-Request-ID header (for load balancers)
 * - Adds ID to response headers for debugging
 * - Makes ID available on req object for logging
 */

import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}

/**
 * Request ID middleware
 * Adds unique ID to each request for tracing through logs
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  // Use existing header or generate new UUID
  const id = (req.headers['x-request-id'] as string) || randomUUID();

  // Attach to request for use in handlers/logging
  req.requestId = id;

  // Add to response headers for client debugging
  res.setHeader('X-Request-ID', id);

  next();
}
