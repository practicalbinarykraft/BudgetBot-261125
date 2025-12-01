/**
 * Custom Error Classes for Better Error Messages
 *
 * Provides user-friendly error messages instead of technical stack traces.
 * Each error class includes:
 * - HTTP status code
 * - User-friendly message
 * - Optional details for debugging
 * - Error code for client-side handling
 */

/**
 * Base Application Error
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Invalid request data', details?: any) {
    super(400, message, 'BAD_REQUEST', details);
  }
}

/**
 * 401 Unauthorized - Not authenticated
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Please log in to continue') {
    super(401, message, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden - Authenticated but not allowed
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(403, message, 'FORBIDDEN');
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', id?: number | string) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(404, message, 'NOT_FOUND');
  }
}

/**
 * 409 Conflict - Resource already exists or conflict
 */
export class ConflictError extends AppError {
  constructor(message: string = 'This resource already exists') {
    super(409, message, 'CONFLICT');
  }
}

/**
 * 422 Unprocessable Entity - Validation failed
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(422, message, 'VALIDATION_ERROR', details);
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(429, message, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * 500 Internal Server Error - Something went wrong
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Something went wrong. Please try again later.') {
    super(500, message, 'INTERNAL_SERVER_ERROR');
  }
}

/**
 * 503 Service Unavailable - External service down
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string = 'Service') {
    super(503, `${service} is temporarily unavailable. Please try again later.`, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Domain-specific errors
 */

export class TransactionError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'TRANSACTION_ERROR', details);
  }
}

export class WalletError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'WALLET_ERROR', details);
  }
}

export class BudgetError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'BUDGET_ERROR', details);
  }
}

export class InsufficientFundsError extends WalletError {
  constructor(available: number, required: number) {
    super(
      `Insufficient funds. Available: $${available.toFixed(2)}, Required: $${required.toFixed(2)}`,
      { available, required }
    );
  }
}

export class BudgetExceededError extends BudgetError {
  constructor(categoryName: string, limit: number, current: number) {
    super(
      `Budget exceeded for ${categoryName}. Limit: $${limit.toFixed(2)}, Current: $${current.toFixed(2)}`,
      { categoryName, limit, current }
    );
  }
}

/**
 * Helper function to check if error is an AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Helper to convert unknown errors to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Hide technical errors from users
    return new InternalServerError('An unexpected error occurred');
  }

  return new InternalServerError('An unknown error occurred');
}

/**
 * User-friendly error messages for common scenarios
 */
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists',

  // Validation
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_DATE: 'Please enter a valid date',
  INVALID_AMOUNT: 'Please enter a valid amount',
  REQUIRED_FIELD: (field: string) => `${field} is required`,

  // Transactions
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  CANNOT_DELETE_TRANSACTION: 'Cannot delete this transaction',
  INVALID_TRANSACTION_TYPE: 'Transaction type must be either "income" or "expense"',

  // Wallets
  WALLET_NOT_FOUND: 'Wallet not found',
  CANNOT_DELETE_WALLET: 'Cannot delete wallet with existing transactions',
  INSUFFICIENT_BALANCE: 'Insufficient wallet balance',

  // Budgets
  BUDGET_NOT_FOUND: 'Budget not found',
  BUDGET_ALREADY_EXISTS: 'A budget for this category already exists',
  INVALID_BUDGET_PERIOD: 'Budget period must be either "monthly" or "yearly"',

  // Categories
  CATEGORY_NOT_FOUND: 'Category not found',
  CANNOT_DELETE_CATEGORY: 'Cannot delete category with existing transactions',

  // General
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  MAINTENANCE: 'The system is under maintenance. Please try again later.',
} as const;
