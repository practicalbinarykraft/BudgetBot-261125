/**
 * Validation Schemas for Assets Routes
 *
 * Zod schemas for request validation
 * Junior-Friendly: <50 lines, focused on validation logic
 */

import { z } from 'zod';

/**
 * Forecast query validation schema
 * Validates 'months' parameter (1-120 range)
 */
export const forecastQuerySchema = z.object({
  months: z.string().optional().transform((val) => {
    if (!val) return 12; // default 12 months (1 year)
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1 || num > 120) {
      throw new Error('months must be between 1 and 120');
    }
    return num;
  })
});

/**
 * History query validation schema
 * Validates startDate/endDate parameters and ensures startDate <= endDate
 */
export const historyQuerySchema = z.object({
  startDate: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: 'Invalid startDate format' }),
  endDate: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, { message: 'Invalid endDate format' }),
}).refine((data) => {
  if (!data.startDate || !data.endDate) return true;
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start <= end;
}, { message: 'startDate must be before or equal to endDate' });
