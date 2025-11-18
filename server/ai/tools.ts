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
  }
  // More tools will be added in Step 3
];
