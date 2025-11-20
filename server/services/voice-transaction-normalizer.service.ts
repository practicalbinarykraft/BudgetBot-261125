/**
 * Voice Transaction Normalizer Service
 * Uses Claude AI to normalize voice transcriptions into structured transactions
 * Handles: "150 тысяч" → 150000, "рупий" → IDR, merchant names, categories
 */

import Anthropic from '@anthropic-ai/sdk';

export interface NormalizedTransaction {
  amount: number;
  currency: 'USD' | 'RUB' | 'IDR' | 'EUR' | 'THB' | 'GBP' | 'JPY' | 'KRW' | 'CNY';
  description: string;
  category?: string;
  merchantName?: string;
  type: 'income' | 'expense';
  confidence: 'high' | 'medium' | 'low';
}

export interface NormalizationError {
  errorCode: 'no_api_key' | 'api_error' | 'parsing_failed' | 'invalid_response';
  fallbackUsed: boolean;
}

export type NormalizationResult = 
  | { success: true; data: NormalizedTransaction }
  | { success: false; error: NormalizationError; fallback: NormalizedTransaction };

export class VoiceTransactionNormalizer {
  
  /**
   * Normalize voice transcription into structured transaction using Claude AI
   */
  async normalize(params: {
    transcribedText: string;
    userCurrency?: string;
    anthropicApiKey?: string;
  }): Promise<NormalizationResult> {
    
    const { transcribedText, userCurrency, anthropicApiKey } = params;
    
    // If no API key, use fallback immediately
    if (!anthropicApiKey) {
      console.log('[VoiceNormalizer] No Anthropic API key, using fallback parser');
      return {
        success: false,
        error: { errorCode: 'no_api_key', fallbackUsed: true },
        fallback: this.fallbackParse(transcribedText, userCurrency)
      };
    }
    
    try {
      const anthropic = new Anthropic({ apiKey: anthropicApiKey });
      
      const prompt = this.buildPrompt(transcribedText, userCurrency);
      
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });
      
      // Find first text content block (robust against non-text blocks)
      const textContent = message.content.find(block => block.type === 'text');
      
      if (!textContent || textContent.type !== 'text') {
        throw new Error('Claude did not return text content');
      }
      
      const responseText = textContent.text;
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Claude did not return valid JSON');
      }
      
      const normalized: NormalizedTransaction = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize required fields
      if (!normalized.amount || normalized.amount <= 0 || !normalized.currency || !normalized.type) {
        console.warn('[VoiceNormalizer] Claude returned incomplete/invalid data:', normalized);
        throw new Error('Claude response missing or invalid required fields');
      }
      
      // Ensure currency is uppercase for parser compatibility
      normalized.currency = normalized.currency.toUpperCase() as NormalizedTransaction['currency'];
      
      console.log('✅ Voice transaction normalized:', normalized);
      
      return { success: true, data: normalized };
      
    } catch (error) {
      console.error('❌ Voice normalization failed:', error);
      
      return {
        success: false,
        error: { 
          errorCode: error instanceof SyntaxError ? 'parsing_failed' : 'api_error',
          fallbackUsed: true 
        },
        fallback: this.fallbackParse(transcribedText, userCurrency)
      };
    }
  }
  
  /**
   * Build Claude prompt for transaction normalization
   */
  private buildPrompt(text: string, userCurrency?: string): string {
    return `You are a financial assistant helping parse voice-recorded transaction messages.

USER'S DEFAULT CURRENCY: ${userCurrency || 'USD'}

VOICE TRANSCRIPTION:
"${text}"

YOUR TASK:
Extract structured financial transaction from this text.

RULES:

1. AMOUNT (convert words to numbers):
   - "150 тысяч" / "150 thousand" → 150000
   - "полтора миллиона" / "one and a half million" → 1500000
   - "пятьсот" / "five hundred" → 500
   - "тыща" / "тысяча" / "k" → 1000

2. CURRENCY:
   Russian: "рублей"/"рубля"/"руб"/"р" → RUB
   Indonesian: "рупий"/"рупии"/"rupiah"/"idr" → IDR
   US: "долларов"/"баксов"/"usd"/"$" → USD
   Euro: "евро"/"eur"/"€" → EUR
   Thai: "батов"/"baht"/"thb"/"฿" → THB
   British: "фунтов"/"gbp"/"£" → GBP
   Japanese: "иен"/"yen"/"jpy"/"¥" → JPY
   Korean: "вон"/"won"/"krw"/"₩" → KRW
   Chinese: "юаней"/"yuan"/"cny"/"¥" → CNY
   
   If not mentioned, use user's default currency: ${userCurrency || 'USD'}

3. DESCRIPTION (clean and concise):
   Remove filler words: "купил"/"потратил"/"заплатил"/"spent"/"paid"
   Fix merchant names: "Старбакс"→"Starbucks", "Индомарет"→"Indomaret"
   Examples:
   - "Купил кофе в Старбаксе" → "Coffee at Starbucks"
   - "Заправился на бензин" → "Gas"
   - "Продукты в Пятёрочке" → "Groceries at Pyaterochka"

4. CATEGORY (guess from context):
   Food & Dining, Transportation, Shopping, Entertainment, Health, Home, Bills, Other

5. MERCHANT NAME (if mentioned):
   Normalize spelling: "Старбакс"→"Starbucks", "Индомарет"→"Indomaret"

6. TYPE:
   Default: expense
   If keywords "получил"/"зарплата"/"доход"/"received"/"salary"/"income" → income

7. CONFIDENCE:
   high: all info clear from text
   medium: had to guess category/currency
   low: text unclear or minimal data

RETURN STRICTLY IN JSON:
{
  "amount": 150000,
  "currency": "IDR",
  "description": "Coffee at Starbucks",
  "category": "Food & Dining",
  "merchantName": "Starbucks",
  "type": "expense",
  "confidence": "high"
}`;
  }
  
  /**
   * Fallback parser when Claude is unavailable
   * Uses simple regex matching with basic magnitude word support
   * 
   * SUPPORTED: "150 тысяч", "2 миллиона", "500k"
   * NOT SUPPORTED: "сто рублей", "пятьсот" (pure word numbers require Claude)
   */
  private fallbackParse(text: string, userCurrency?: string): NormalizedTransaction {
    const cleaned = text.toLowerCase();
    
    // Extract base amount (number before magnitude word)
    const amountMatch = cleaned.match(/(\d+(?:[.,]\d+)?)\s*(?:тысяч|тыс|thousand|k|к|миллион|million|m|м)?/i);
    let amount = 0;
    
    if (amountMatch) {
      const baseAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
      const fullMatch = amountMatch[0];
      
      // Apply magnitude multipliers
      if (fullMatch.match(/тысяч|тыс|thousand|k|к/i)) {
        amount = baseAmount * 1000;
      } else if (fullMatch.match(/миллион|million|m|м/i)) {
        amount = baseAmount * 1000000;
      } else {
        amount = baseAmount;
      }
    }
    
    // Detect currency from keywords
    let currency: NormalizedTransaction['currency'] = (userCurrency as any) || 'USD';
    
    if (cleaned.match(/рупи|rupiah|idr/i)) currency = 'IDR';
    else if (cleaned.match(/рубл|руб|rub/i)) currency = 'RUB';
    else if (cleaned.match(/доллар|бакс|usd|\$/i)) currency = 'USD';
    else if (cleaned.match(/евро|eur|€/i)) currency = 'EUR';
    else if (cleaned.match(/бат|baht|thb|฿/i)) currency = 'THB';
    else if (cleaned.match(/фунт|gbp|£/i)) currency = 'GBP';
    else if (cleaned.match(/иен|yen|jpy|¥/i)) currency = 'JPY';
    else if (cleaned.match(/вон|won|krw|₩/i)) currency = 'KRW';
    else if (cleaned.match(/юан|yuan|cny/i)) currency = 'CNY';
    
    // Uppercase currency for parser compatibility
    currency = currency.toUpperCase() as NormalizedTransaction['currency'];
    
    return {
      amount,
      currency,
      description: text.slice(0, 100).trim(),
      type: 'expense',
      confidence: 'low'
    };
  }
}

export const voiceTransactionNormalizer = new VoiceTransactionNormalizer();
