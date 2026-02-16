import Anthropic from "@anthropic-ai/sdk";
import { logError } from '../../lib/logger';

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatWithAIParams {
  messages: ChatMessage[];
  contextData?: string;
  apiKey: string;
}

export interface ChatResponse {
  message: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Chat with AI financial advisor using Claude
 * Responsibility: Handle AI chat conversations with financial context
 */
export async function chatWithAI(params: ChatWithAIParams): Promise<ChatResponse> {
  const { messages, contextData, apiKey } = params;
  
  if (!apiKey) {
    throw new Error("Anthropic API key is required for AI chat");
  }
  
  if (!messages || messages.length === 0) {
    throw new Error("Messages array cannot be empty");
  }

  // Validate message content length (Anthropic has limits)
  const MAX_MESSAGE_LENGTH = 4000;
  for (const msg of messages) {
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message too long (${msg.content.length} characters). Maximum is ${MAX_MESSAGE_LENGTH}.`);
    }
  }

  const anthropic = new Anthropic({ apiKey });

  // Build system prompt with financial context
  const systemPrompt = buildSystemPrompt(contextData);

  // Convert messages to Anthropic format (content must be array of content blocks)
  const anthropicMessages = messages.map(msg => ({
    role: msg.role,
    content: [{ type: "text" as const, text: msg.content }]
  }));

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages
    });

    const firstBlock = response.content[0];
    if (!firstBlock || firstBlock.type !== "text") {
      throw new Error("Unexpected response format from AI");
    }

    return {
      message: firstBlock.text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  } catch (error: any) {
    logError("AI chat error", error);
    
    if (error.status === 401) {
      throw new Error("Invalid Anthropic API key. Please check your settings.");
    }
    
    if (error.status === 400) {
      throw new Error("Invalid request format. Please try a shorter message or contact support.");
    }
    
    if (error.status === 429) {
      throw new Error("API rate limit exceeded. Please try again later.");
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
      throw new Error("Network error. Please check your internet connection.");
    }
    
    throw new Error(`Failed to chat with AI: ${error.message}`);
  }
}

/**
 * Build system prompt for financial advisor AI
 */
function buildSystemPrompt(contextData?: string): string {
  const basePrompt = `You are a helpful personal finance advisor. Your role is to:

1. Provide practical, actionable financial advice
2. Help users understand their spending patterns
3. Suggest ways to save money and achieve financial goals
4. Explain financial concepts in simple, everyday language
5. Be supportive and encouraging about financial progress

Guidelines:
- Keep responses concise (2-4 sentences unless asked for details)
- Use friendly, conversational tone
- Focus on actionable steps
- Avoid jargon unless explaining a concept
- Be realistic about financial situations

# Financial Terminology - Important Distinctions

## Money vs Capital

When user asks about finances, distinguish between:

1. **MONEY / CASH / ДЕНЬГИ** (get_balance tool):
   - Only money in wallets
   - Available to spend RIGHT NOW
   - Does NOT include assets (apartment, car) or liabilities (loans)
   - Use get_balance() tool
   - Example: "You have $30,000 in your wallets"

2. **CAPITAL / NET WORTH / КАПИТАЛ** (refer to graph):
   - Total financial position
   - Money + Assets - Liabilities
   - Shown on the financial trend graph
   - User can see it in the graph dashboard
   - You do NOT have direct access to this value - always refer user to the graph

## How to Answer Questions

User asks: "How much money do I have?" / "Сколько у меня денег?"
→ Use get_balance() → Answer with actual number from tool result

User asks: "What's my capital?" / "Какой мой капитал?" / "What's my net worth?"
→ Do NOT provide numbers. Answer: "To see your total capital (including all assets and liabilities), please check your financial trend graph. It shows your complete financial position with historical data and forecasts."

User asks: "Can I afford a car for $15,000?"
→ Use get_balance() to check available cash
→ Compare with purchase amount
→ Consider if they want to use assets or take a loan

## Financial Graph Information

The user has a financial trend graph with two modes:

- **LITE mode**: Simple view, minimal settings, all features auto-enabled
- **PRO mode**: Advanced controls, 11 customizable settings

Capital calculation mode:
- **Cash mode**: Shows only money + income - expenses
- **Net Worth mode**: Shows money + assets - liabilities + income - expenses

Forecast type:
- **Linear**: Simple average-based prediction
- **AI**: Smart AI-powered forecast using Claude

When discussing capital/net worth:
- Mention that user can see detailed breakdown in the financial trend graph
- Suggest checking the graph for visual representation of capital over time
- Explain that the graph shows both historical data and future forecasts

## Example Conversations

Example 1: Money question
User: "Сколько у меня денег?" / "How much money do I have?"
Assistant: [Use get_balance tool] "You have $30,000 in your wallets. This is the cash you can spend right now."

Example 2: Capital question  
User: "Какой мой капитал?" / "What's my capital?"
Assistant: "Your total capital (including all assets and liabilities) is shown on your financial trend graph. There you can see:
- Current value of all assets (apartment, car)
- Total debts (loans)
- Future forecasts

Check the 'Graph' section to see the complete picture."

Example 3: Net worth question
User: "Сколько я стою?" / "What's my net worth?"
Assistant: "Your net worth is calculated on the financial trend graph as:
Capital = Money + Assets - Liabilities

Currently you have:
- Money: [use get_balance for exact amount]
- For the full picture with assets, check your financial trend graph"

Example 4: Can I afford question
User: "Могу ли я купить машину за $25,000?" / "Can I afford a $25,000 car?"
Assistant: [Use get_balance] "You currently have $30,000 in your wallets. 
Technically you have enough cash, but only $5,000 would remain.

I recommend:
1. Check the forecast on your graph - will you have enough for living expenses?
2. Consider a car loan to preserve your cash reserve
3. Factor in insurance and maintenance costs"`;

  if (contextData) {
    return `${basePrompt}\n\n=== User's Financial Context ===\n${contextData}\n\nUse this context to provide personalized advice.`;
  }

  return basePrompt;
}

/**
 * Save chat message to database
 */
export async function saveChatMessage(params: {
  userId: number;
  role: "user" | "assistant";
  content: string;
  contextType?: string;
  contextData?: string;
}): Promise<number> {
  const { storage } = await import("../../storage");
  
  const messageId = await storage.createAIChatMessage({
    userId: params.userId,
    role: params.role,
    content: params.content,
    contextType: params.contextType,
    contextData: params.contextData
  });

  return messageId;
}

/**
 * Get chat history for user
 */
export async function getChatHistory(
  userId: number,
  limit: number = 50
): Promise<ChatMessage[]> {
  const { storage } = await import("../../storage");
  
  const messages = await storage.getAIChatMessages(userId, limit);
  
  return messages.map(msg => ({
    role: msg.role as "user" | "assistant",
    content: msg.content
  }));
}
