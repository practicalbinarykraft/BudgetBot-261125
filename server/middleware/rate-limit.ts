import rateLimit from "express-rate-limit";

/**
 * Rate limiting middleware for authentication routes
 * Prevents brute-force attacks on login/register endpoints
 *
 * Limits: 5 requests per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many authentication attempts from this IP, please try again after 15 minutes"
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Store in memory (for simple deployments)
  // For production with multiple instances, use Redis store
  skipSuccessfulRequests: false, // Count all requests
  skipFailedRequests: false, // Count failed requests too
});

/**
 * Rate limiting middleware for AI API routes
 * Prevents quota exhaustion and abuse
 *
 * Limits: 20 requests per minute per user
 */
export const aiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each user to 20 AI requests per minute
  message: {
    error: "Too many AI requests, please slow down. You can make up to 20 requests per minute."
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID as key (instead of IP) for authenticated routes
  keyGenerator: (req) => {
    // If authenticated, use user ID (no IP fallback needed)
    const userId = (req.user as any)?.id;
    if (userId) {
      return `user:${userId}`;
    }
    // For unauthenticated requests, use a fixed key
    // (AI endpoints should require authentication anyway)
    return 'unauthenticated';
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * General API rate limiting middleware
 * Prevents general abuse and DDoS
 *
 * Limits: 100 requests per 15 minutes per IP
 */
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Strict rate limiting for sensitive operations
 * For operations like password reset, email verification, etc.
 *
 * Limits: 3 requests per hour per IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 requests per hour
  message: {
    error: "Too many attempts, please try again later"
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

/**
 * Rate limiting for heavy operations
 * For operations like reports, stats, analytics that are computationally expensive
 *
 * Limits: 30 requests per 5 minutes per user
 */
export const heavyOperationRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // Limit each user to 30 requests per 5 minutes
  message: {
    error: "Too many heavy requests. Please wait a few minutes before trying again."
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use user ID as key (instead of IP) for authenticated routes
  keyGenerator: (req) => {
    const userId = (req.user as any)?.id;
    if (userId) {
      return `heavy:user:${userId}`;
    }
    // For unauthenticated requests (shouldn't happen on these routes)
    return `heavy:ip:${req.ip || 'unknown'}`;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});
