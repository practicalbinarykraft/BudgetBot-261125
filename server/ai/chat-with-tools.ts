// AI Chat with Tool Calling - uses BYOK (Bring Your Own Key)
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_TOOLS } from './tools';
import { storage } from '../storage';
import { getUserCategories } from '../services/categorization.service';

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
  
  // Get user categories for smart categorization
  const categories = await getUserCategories(userId);
  
  // Build categories list for prompt
  const categoriesList = categories.length > 0
    ? categories.map(c => `- ${c.name} (${c.type})`).join('\n')
    : '(No categories yet)';
  
  // User's default currency
  const defaultCurrency = settings.currency || 'USD';
  
  // Initialize Anthropic client with user's key
  const anthropic = new Anthropic({ 
    apiKey: settings.anthropicApiKey 
  });
  
  // System prompt for financial assistant with tool calling
  const systemPrompt = `You are a helpful financial assistant for Budget Buddy app.

User settings:
- Default currency: ${defaultCurrency}

Available user categories:
${categoriesList}

Smart category detection (when adding transactions):
- "ресторан", "кафе", "еда вне дома", "restaurant", "cafe" → Рестораны/Restaurants
- "продукты", "магазин", "супермаркет", "groceries", "store" → Продукты/Groceries
- "такси", "uber", "транспорт", "taxi", "transport" → Транспорт/Transport
- "развлечения", "кино", "cinema", "entertainment" → Развлечения/Entertainment
- "здоровье", "аптека", "врач", "health", "pharmacy" → Здоровье/Health

Currency detection rules (when adding transactions):
- "к", "won", "₩", ending with "k" (Korean context) → KRW
- "р", "руб", "₽", "rub" → RUB  
- "$", "usd", "dollar", "bucks" → USD
- "€", "eur", "euro" → EUR
- "¥", "cny", "yuan", "rmb" → CNY
- If no currency mentioned → use ${defaultCurrency}
- Examples: "220k" (Korean) → 220000 KRW, "100р" → 100 RUB, "$50" → 50 USD

Rules:
1. Try to detect category from description using keywords above
2. Use exact category name from user's list
3. If category not found in user's list → leave empty (user will choose)
4. Always try to detect currency from context/symbols
5. Support multilingual input (English/Russian/Korean)

You can help users with:
- Checking their balance and wallet information
- Creating new transaction categories
- Adding transactions (income/expenses)

When users ask for information or actions, use the available tools to help them.
Be concise, friendly, and accurate.`;
  
  // Call Claude with tools enabled
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    system: systemPrompt,
    tools: ANTHROPIC_TOOLS, // Enable tool calling (clean definitions only)
    messages: [{ role: 'user', content: message }]
  });
  
  return response;
}
