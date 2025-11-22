// AI Agent Tool Definitions
// Split into 2 structures to comply with Anthropic API requirements

// 1. Clean tool definitions for Anthropic API (no custom fields)
export const ANTHROPIC_TOOLS = [
  {
    name: 'get_balance',
    description: 'Get current user wallet balance (cash only - money available to spend right now). Use this when user asks about available money, cash, or balance. Does NOT include assets (property, vehicles) or liabilities (loans, debts). For questions about total net worth or capital, refer user to financial trend graph.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: []
    }
  },
  {
    name: 'create_category',
    description: 'Create a new transaction category for organizing income or expenses. Use this when user wants to add a new category.',
    input_schema: {
      type: 'object' as const,
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
    input_schema: {
      type: 'object' as const,
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
        personal_tag: { 
          type: 'string', 
          description: 'Personal tag name for tracking who spent/received (optional)' 
        },
        date: { 
          type: 'string', 
          description: 'Date in YYYY-MM-DD format (optional, defaults to today)' 
        },
        currency: { 
          type: 'string', 
          description: '3-letter currency code like KRW, USD, RUB (optional)' 
        }
      },
      required: ['amount', 'description', 'type']
    }
  }
];

// 2. Tool metadata for our custom logic (confirmation, icons, etc)
export const TOOL_METADATA: Record<string, {
  requiresConfirmation: boolean;
  icon?: string;
  category?: string;
}> = {
  'get_balance': {
    requiresConfirmation: false, // READ operation
    icon: 'wallet',
    category: 'read'
  },
  'create_category': {
    requiresConfirmation: true, // WRITE operation
    icon: 'folder',
    category: 'write'
  },
  'add_transaction': {
    requiresConfirmation: true, // WRITE operation
    icon: 'dollar-sign',
    category: 'write'
  }
};

// 3. Helper functions
export function requiresConfirmation(toolName: string): boolean {
  return TOOL_METADATA[toolName]?.requiresConfirmation ?? false;
}

export function getToolIcon(toolName: string): string {
  return TOOL_METADATA[toolName]?.icon ?? 'bot';
}

export function getToolCategory(toolName: string): string {
  return TOOL_METADATA[toolName]?.category ?? 'unknown';
}
