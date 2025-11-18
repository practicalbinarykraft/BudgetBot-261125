// TypeScript types for AI Agent Tool Calling System

export type ToolName = 
  | 'get_balance'
  | 'create_category'
  | 'add_transaction';

export interface Tool {
  name: ToolName;
  description: string;
  requiresConfirmation: boolean;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface ToolConfirmation {
  action: ToolName;
  params: Record<string, any>;
  preview: string;
}

export interface ToolExecutionRecord {
  id?: number;
  userId: number;
  sessionId?: string;
  toolName: string;
  params: string; // JSON string
  result?: string; // JSON string
  status: 'pending' | 'confirmed' | 'executed' | 'cancelled';
  executedAt?: Date;
  createdAt?: Date;
}
