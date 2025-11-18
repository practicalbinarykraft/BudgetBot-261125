// AI Agent Tool Definitions
import { Tool } from './tool-types';

export const TOOLS: Tool[] = [
  {
    name: 'get_balance',
    description: 'Get current user wallet balance and capital. Use this when user asks about their money, balance, or how much they have.',
    requiresConfirmation: false, // READ operation - no confirmation needed
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'create_category',
    description: 'Create a new transaction category for organizing income or expenses. Use this when user wants to add a new category.',
    requiresConfirmation: true, // WRITE operation - requires confirmation
    input_schema: {
      type: 'object',
      properties: {
        name: { 
          type: 'string', 
          description: 'Category name (e.g., "Restaurants", "Salary")' 
        },
        type: { 
          type: 'string', 
          enum: ['income', 'expense'], 
          description: 'Category type: income or expense' 
        },
        icon: { 
          type: 'string', 
          description: 'Lucide icon name (optional, defaults to "Tag")' 
        },
        color: { 
          type: 'string', 
          description: 'Hex color code (optional, defaults to "#3b82f6")' 
        }
      },
      required: ['name', 'type']
    }
  },
  {
    name: 'add_transaction',
    description: 'Add a new income or expense transaction. Use this when user wants to record spending or income.',
    requiresConfirmation: true, // WRITE operation - requires confirmation
    input_schema: {
      type: 'object',
      properties: {
        amount: { 
          type: 'number', 
          description: 'Transaction amount (positive number)' 
        },
        description: { 
          type: 'string', 
          description: 'Transaction description (e.g., "Lunch at cafe")' 
        },
        category: { 
          type: 'string', 
          description: 'Category name (optional)' 
        },
        type: { 
          type: 'string', 
          enum: ['income', 'expense'], 
          description: 'Transaction type: income or expense' 
        },
        date: { 
          type: 'string', 
          description: 'Date in YYYY-MM-DD format (optional, defaults to today)' 
        }
      },
      required: ['amount', 'description', 'type']
    }
  }
];
