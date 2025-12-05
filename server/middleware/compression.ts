/**
 * Response Compression Middleware
 *
 * Compresses HTTP responses with gzip/deflate for faster transfers.
 * Junior-Friendly: ~30 lines, simple configuration
 *
 * Benefits:
 * - Reduces bandwidth usage by 60-80%
 * - Faster page loads for users
 * - Lower hosting costs
 */

import compression from 'compression';
import type { Request, Response } from 'express';

/**
 * Compression filter function
 * Determines which responses to compress
 */
function shouldCompress(req: Request, res: Response): boolean {
  // Don't compress if client doesn't accept it
  if (req.headers['x-no-compression']) {
    return false;
  }

  // Skip compression for small responses (< 1KB)
  // Compression overhead isn't worth it for tiny responses
  const contentLength = res.getHeader('Content-Length');
  if (contentLength && Number(contentLength) < 1024) {
    return false;
  }

  // Use default filter for everything else
  return compression.filter(req, res);
}

/**
 * Compression middleware with optimized settings
 */
export const compressResponse = compression({
  // Minimum size to compress (bytes)
  threshold: 1024,

  // Compression level (1-9, higher = smaller but slower)
  // Level 6 is good balance between size and speed
  level: 6,

  // Use filter function
  filter: shouldCompress,
});
