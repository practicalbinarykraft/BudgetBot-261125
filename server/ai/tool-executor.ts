// Tool Executor - executes AI agent tool calls
import { ToolName, ToolResult } from './tool-types';
import * as handlers from './handlers';

export async function executeTool(
  toolName: ToolName,
  params: Record<string, any>,
  userId: number
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'get_balance':
        return await handlers.handleGetBalance(userId);
      
      case 'create_category':
        return await handlers.handleCreateCategory(userId, params as any);
      
      case 'add_transaction':
        return await handlers.handleAddTransaction(userId, params as any);
      
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Tool execution failed'
    };
  }
}
