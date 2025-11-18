// Zod schemas for AI tool input validation
import { z } from 'zod';

// get_balance tool schema (no params)
export const getBalanceSchema = z.object({});

// create_category tool schema
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be income or expense' })
  }),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional()
});

// add_transaction tool schema (with coerce for type safety)
export const addTransactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required').max(200),
  category: z.string().optional().transform(val => val || undefined),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be income or expense' })
  }),
  personal_tag: z.string().optional().transform(val => val || undefined),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  currency: z.string().length(3, 'Currency must be 3-letter code').optional()
});

// Tool schemas map
export const TOOL_SCHEMAS: Record<string, z.ZodSchema> = {
  'get_balance': getBalanceSchema,
  'create_category': createCategorySchema,
  'add_transaction': addTransactionSchema
};

// Validate tool params
export function validateToolParams(toolName: string, params: any) {
  const schema = TOOL_SCHEMAS[toolName];
  
  if (!schema) {
    throw new Error(`No validation schema for tool: ${toolName}`);
  }
  
  return schema.parse(params); // Throws ZodError if invalid
}
