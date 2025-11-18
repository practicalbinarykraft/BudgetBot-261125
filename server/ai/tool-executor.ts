// Tool Executor - executes AI agent tool calls
import { ToolName, ToolResult } from './tool-types';
import { handleGetBalance } from './handlers/balance-handler';

export async function executeTool(
  toolName: ToolName,
  params: Record<string, any>,
  userId: number
): Promise<ToolResult> {
  try {
    switch (toolName) {
      case 'get_balance':
        return await handleGetBalance(userId);
      
      case 'create_category':
        // Will be implemented in Step 3
        return {
          success: false,
          error: 'Handler not yet implemented'
        };
      
      case 'add_transaction':
        // Will be implemented in Step 3
        return {
          success: false,
          error: 'Handler not yet implemented'
        };
      
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
