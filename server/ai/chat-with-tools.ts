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
  
  // Build available currencies list (USD + default + configured)
  const availableCurrencies: string[] = ['USD']; // USD is always available
  
  // Always add default currency (even without rate - prevents AI from rejecting default)
  if (defaultCurrency && !availableCurrencies.includes(defaultCurrency)) {
    availableCurrencies.push(defaultCurrency);
  }
  
  const currencyRules: string[] = [];
  const currencyExamples: string[] = [];
  
  if (settings.exchangeRateRUB) {
    availableCurrencies.push('RUB');
    currencyRules.push('- "р", "руб", "₽", "rub" → RUB');
    currencyExamples.push('"100р" → 100 RUB');
  }
  if (settings.exchangeRateIDR) {
    availableCurrencies.push('IDR');
    currencyRules.push('- "idr", "rupiah" → IDR');
    currencyExamples.push('"50000 rupiah" → 50000 IDR');
  }
  if (settings.exchangeRateKRW) {
    availableCurrencies.push('KRW');
    currencyRules.push('- "к", "won", "₩", ending with "k" (Korean context) → KRW');
    currencyExamples.push('"220k" (Korean) → 220000 KRW');
  }
  if (settings.exchangeRateEUR) {
    availableCurrencies.push('EUR');
    currencyRules.push('- "€", "eur", "euro" → EUR');
    currencyExamples.push('"€50" → 50 EUR');
  }
  if (settings.exchangeRateCNY) {
    availableCurrencies.push('CNY');
    currencyRules.push('- "¥", "cny", "yuan", "rmb" → CNY');
    currencyExamples.push('"¥100" → 100 CNY');
  }
  
  // Always include USD detection
  currencyRules.unshift('- "$", "usd", "dollar", "bucks" → USD');
  currencyExamples.unshift('"$50" → 50 USD');
  
  const currencyDetectionRules = currencyRules.join('\n');
  const currencyExamplesStr = currencyExamples.join(', ');
  
  // Initialize Anthropic client with user's key
  const anthropic = new Anthropic({ 
    apiKey: settings.anthropicApiKey 
  });
  
  // System prompt for financial assistant with tool calling
  const systemPrompt = `You are a helpful financial assistant for Budget Buddy app.

User settings:
- Default currency: ${defaultCurrency}
- Configured currencies: ${availableCurrencies.join(', ')}

Available user categories:
${categoriesList}

Smart category detection (when adding transactions):
- "ресторан", "кафе", "еда вне дома", "restaurant", "cafe" → Рестораны/Restaurants
- "продукты", "магазин", "супермаркет", "groceries", "store" → Продукты/Groceries
- "такси", "uber", "транспорт", "taxi", "transport" → Транспорт/Transport
- "развлечения", "кино", "cinema", "entertainment" → Развлечения/Entertainment
- "здоровье", "аптека", "врач", "health", "pharmacy" → Здоровье/Health

Currency detection rules (when adding transactions):
${currencyDetectionRules}
- If no currency mentioned → use ${defaultCurrency}
- Examples: ${currencyExamplesStr}

IMPORTANT: Only use currencies from the configured list above (${availableCurrencies.join(', ')}).
If user mentions a currency not in this list, inform them they need to configure it in Settings first.

Rules:
1. Try to detect category from description using keywords above
2. Use exact category name from user's list
3. If category not found in user's list → leave empty (user will choose)
4. Always try to detect currency from context/symbols
5. ONLY use currencies from configured list: ${availableCurrencies.join(', ')}
6. Support multilingual input (English/Russian/Korean)

You can help users with:
- Checking their balance and wallet information
- Creating new transaction categories
- Adding transactions (income/expenses) in configured currencies only

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
