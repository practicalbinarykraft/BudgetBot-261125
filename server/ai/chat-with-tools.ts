// AI Chat with Tool Calling - uses BYOK (Bring Your Own Key)
import Anthropic from '@anthropic-ai/sdk';
import { TOOLS } from './tools';
import { storage } from '../storage';

export async function chatWithTools(
  message: string,
  userId: number
) {
  // Get user's Anthropic API key from settings (BYOK)
  const settings = await storage.getSettingsByUserId(userId);
  
  if (!settings?.anthropicApiKey) {
    throw new Error(
      'API key not configured. Please add your Anthropic API key in Settings.'
    );
  }
  
  // Initialize Anthropic client with user's key
  const anthropic = new Anthropic({ 
    apiKey: settings.anthropicApiKey 
  });
  
  // System prompt for financial assistant with tool calling
  const systemPrompt = `You are a helpful financial assistant for Budget Buddy app.
You can help users with:
- Checking their balance and wallet information
- Creating new transaction categories
- Adding transactions (income/expenses)

When users ask for information or actions, use the available tools to help them.
Be concise, friendly, and accurate. Always confirm before making changes to user data.`;
  
  // Call Claude with tools enabled
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
    tools: TOOLS, // Enable tool calling
    messages: [{ role: 'user', content: message }]
  });
  
  return response;
}
