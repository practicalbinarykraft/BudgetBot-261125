/**
 * OpenRouter AI Provider
 * Uses DeepSeek model through OpenRouter for free AI chat
 */
import { logError } from '../../lib/logger';

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterChatParams {
  messages: OpenRouterMessage[];
  model?: string;
  maxTokens?: number;
}

export interface OpenRouterChatResponse {
  message: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * Chat with AI using OpenRouter (DeepSeek model)
 * Uses server's OpenRouter API key from environment
 */
export async function chatWithOpenRouter(
  params: OpenRouterChatParams
): Promise<OpenRouterChatResponse> {
  const { messages, model = "deepseek/deepseek-chat", maxTokens = 1024 } = params;

  const apiKey = process.env.SYSTEM_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("SYSTEM_OPENROUTER_API_KEY not configured in environment");
  }

  if (!messages || messages.length === 0) {
    throw new Error("Messages array cannot be empty");
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://budgetbot.app",
        "X-Title": "BudgetBot AI Chat"
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error("Invalid OpenRouter API key");
      }

      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }

      if (response.status === 402) {
        throw new Error("Insufficient credits on OpenRouter account");
      }

      throw new Error(
        errorData.error?.message || `OpenRouter API error: ${response.status}`
      );
    }

    const data = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from AI model");
    }

    const messageContent = data.choices[0].message?.content;
    if (!messageContent) {
      throw new Error("Empty response from AI model");
    }

    return {
      message: messageContent,
      usage: {
        inputTokens: data.usage?.prompt_tokens || 0,
        outputTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    };
  } catch (error: any) {
    logError("OpenRouter chat error", error);

    if (error.message.includes("fetch")) {
      throw new Error("Network error. Please check your internet connection.");
    }

    throw error;
  }
}

/**
 * Build financial advisor system prompt
 * Same as Anthropic version for consistency
 */
export function buildFinancialAdvisorPrompt(contextData?: string): string {
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
