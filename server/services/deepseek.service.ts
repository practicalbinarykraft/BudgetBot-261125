/**
 * DeepSeek API Client
 *
 * DeepSeek V3 is 12x cheaper than Claude for simple tasks
 * API is OpenAI-compatible
 */

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call DeepSeek API (OpenAI-compatible)
 *
 * @param apiKey - DeepSeek API key
 * @param messages - Chat messages
 * @param temperature - Randomness (0-1)
 * @returns Response with content and token usage
 */
export async function callDeepSeek(
  apiKey: string,
  messages: DeepSeekMessage[],
  temperature: number = 0.7
): Promise<DeepSeekResponse> {

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${error}`);
  }

  const data: DeepSeekResponse = await response.json();
  return data;
}

/**
 * Parse transaction text using DeepSeek
 * Use for voice normalization and text parsing
 *
 * Example: "купил кофе за триста рублей" → {amount: 300, currency: "RUB", description: "кофе"}
 */
export async function parseTransactionWithDeepSeek(
  apiKey: string,
  text: string,
  userCurrency: string
): Promise<{
  amount: number;
  currency: string;
  description: string;
  category?: string;
}> {

  const systemPrompt = `You are a transaction parser. Extract amount, currency, and description from user's text.
User's default currency (use ONLY if no currency is mentioned in text): ${userCurrency}

Rules:
- Extract numeric amount (handle text numbers like "триста" = 300, "пятьсот" = 500)
- ALWAYS detect currency from text first: рублей/руб/₽ = RUB, долларов/$ = USD, рупий/Rp = IDR, евро/€ = EUR, вон/₩ = KRW, юаней/¥ = CNY
- Only use default currency if NO currency is mentioned at all
- Extract short description (the item/service name)
- Respond ONLY with JSON: {"amount": number, "currency": "CODE", "description": "text", "category": "optional"}

Examples:
Input: "шашлык 500 рублей"
Output: {"amount": 500, "currency": "RUB", "description": "шашлык", "category": "Food & Drinks"}

Input: "купил кофе за триста рублей"
Output: {"amount": 300, "currency": "RUB", "description": "кофе", "category": "Food & Drinks"}

Input: "spent 50 dollars on groceries"
Output: {"amount": 50, "currency": "USD", "description": "groceries", "category": "Food & Drinks"}

Input: "такси 200"
Output: {"amount": 200, "currency": "${userCurrency}", "description": "такси", "category": "Transport"}`;

  const response = await callDeepSeek(
    apiKey,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    0.3 // Low temperature for structured output
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('DeepSeek returned empty response');
  }

  // Parse JSON response
  try {
    const parsed = JSON.parse(content);
    return {
      amount: parsed.amount,
      currency: parsed.currency || userCurrency,
      description: parsed.description,
      category: parsed.category,
    };
  } catch (err) {
    console.error('Failed to parse DeepSeek JSON:', content);
    throw new Error('Invalid response format from DeepSeek');
  }
}

/**
 * Categorize transaction using DeepSeek
 * Much cheaper than Claude for this simple task
 */
export async function categorizeTransactionWithDeepSeek(
  apiKey: string,
  description: string,
  amount: number,
  existingCategories: string[]
): Promise<string> {

  const systemPrompt = `You are a transaction categorizer.
Given a transaction description and amount, suggest the best category.

Available categories: ${existingCategories.join(', ')}

Respond ONLY with the category name, nothing else.`;

  const response = await callDeepSeek(
    apiKey,
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Description: ${description}\nAmount: $${amount}` },
    ],
    0.1 // Very low temperature for consistency
  );

  const category = response.choices[0]?.message?.content.trim();

  // Validate category exists
  if (existingCategories.includes(category)) {
    return category;
  }

  // Fallback to most similar
  return existingCategories[0] || 'Other';
}
