/**
 * Error Classes Tests
 *
 * Tests for custom error classes and utilities.
 * Junior-Friendly: ~80 lines, covers all error types
 */

import { describe, it, expect } from 'vitest';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  InsufficientFundsError,
  BudgetExceededError,
  isAppError,
  getErrorMessage,
  toAppError,
} from '../errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('creates error with correct properties', () => {
      const error = new AppError(400, 'Test error', 'TEST_ERROR', { foo: 'bar' });

      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ foo: 'bar' });
    });

    it('serializes to JSON correctly', () => {
      const error = new AppError(400, 'Test', 'TEST', { detail: 1 });
      const json = error.toJSON();

      expect(json.error).toBe('Test');
      expect(json.code).toBe('TEST');
      expect(json.details).toEqual({ detail: 1 });
    });
  });

  describe('HTTP Error Classes', () => {
    it('BadRequestError has status 400', () => {
      const error = new BadRequestError();
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });

    it('UnauthorizedError has status 401', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
    });

    it('ForbiddenError has status 403', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
    });

    it('NotFoundError has status 404', () => {
      const error = new NotFoundError('User', 123);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('User with ID 123 not found');
    });

    it('ValidationError has status 422', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      expect(error.statusCode).toBe(422);
      expect(error.details).toEqual({ field: 'email' });
    });

    it('RateLimitError has status 429', () => {
      const error = new RateLimitError();
      expect(error.statusCode).toBe(429);
    });

    it('InternalServerError has status 500', () => {
      const error = new InternalServerError();
      expect(error.statusCode).toBe(500);
    });

    it('ServiceUnavailableError has status 503', () => {
      const error = new ServiceUnavailableError('API');
      expect(error.statusCode).toBe(503);
      expect(error.message).toContain('API');
    });
  });

  describe('Domain Errors', () => {
    it('InsufficientFundsError shows amounts', () => {
      const error = new InsufficientFundsError(50, 100);
      expect(error.message).toContain('50.00');
      expect(error.message).toContain('100.00');
    });

    it('BudgetExceededError shows category and limits', () => {
      const error = new BudgetExceededError('Food', 200, 250);
      expect(error.message).toContain('Food');
      expect(error.message).toContain('200.00');
      expect(error.message).toContain('250.00');
    });
  });

  describe('Helper Functions', () => {
    it('isAppError returns true for AppError', () => {
      expect(isAppError(new AppError(400, 'test', 'TEST'))).toBe(true);
      expect(isAppError(new BadRequestError())).toBe(true);
    });

    it('isAppError returns false for regular Error', () => {
      expect(isAppError(new Error('test'))).toBe(false);
      expect(isAppError('string')).toBe(false);
      expect(isAppError(null)).toBe(false);
    });

    it('getErrorMessage extracts message from Error', () => {
      expect(getErrorMessage(new Error('test message'))).toBe('test message');
      expect(getErrorMessage('string error')).toBe('string error');
      expect(getErrorMessage(123)).toBe('An unknown error occurred');
    });

    it('toAppError converts regular Error to InternalServerError', () => {
      const result = toAppError(new Error('test'));
      expect(result).toBeInstanceOf(InternalServerError);
      expect(result.statusCode).toBe(500);
    });

    it('toAppError returns AppError as-is', () => {
      const original = new BadRequestError('custom');
      const result = toAppError(original);
      expect(result).toBe(original);
    });
  });
});
