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
   * Uses simple regex matching with basic word-to-number mapping
   * 
   * SUPPORTED: 
   * - Numbers with magnitudes: "150 тысяч", "2 миллиона", "500k"
   * - Common Russian numerals: "сто", "двести", "триста", "пятьсот" etc.
   * - Common English numerals: "hundred", "thousand"
   * 
   * NOT SUPPORTED: Complex combinations ("сто пятьдесят три")
   */
  private fallbackParse(text: string, userCurrency?: string): NormalizedTransaction {
    const cleaned = text.toLowerCase();
    
    // Word-to-number mapping (Russian and English)
    const wordToNumber: Record<string, number> = {
      // Russian 1-19
      'один': 1, 'одна': 1, 'одно': 1, 'два': 2, 'две': 2, 'три': 3, 'четыре': 4, 'пять': 5,
      'шесть': 6, 'семь': 7, 'восемь': 8, 'девять': 9, 'десять': 10,
      'одиннадцать': 11, 'двенадцать': 12, 'тринадцать': 13, 'четырнадцать': 14, 'пятнадцать': 15,
      'шестнадцать': 16, 'семнадцать': 17, 'восемнадцать': 18, 'девятнадцать': 19,
      // Russian tens
      'двадцать': 20, 'тридцать': 30, 'сорок': 40, 'пятьдесят': 50,
      'шестьдесят': 60, 'семьдесят': 70, 'восемьдесят': 80, 'девяносто': 90,
      // Russian hundreds
      'сто': 100, 'двести': 200, 'триста': 300, 'четыреста': 400,
      'пятьсот': 500, 'шестьсот': 600, 'семьсот': 700, 'восемьсот': 800, 'девятьсот': 900,
      // Russian magnitudes
      'тысяча': 1000, 'тысячи': 1000, 'тысяч': 1000, 'тыс': 1000,
      'миллион': 1000000, 'миллиона': 1000000, 'миллионов': 1000000,
      // English 1-19
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
      'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
      'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19,
      // English tens
      'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90,
      // English magnitudes
      'hundred': 100, 'thousand': 1000, 'million': 1000000,
      // Short forms
      'k': 1000, 'к': 1000, 'm': 1000000, 'м': 1000000
    };
    
    let amount = 0;
    
    // Priority 1A: Check for "X hundred thousand/million" patterns FIRST
    // (e.g., "one hundred thousand" = 100 × 1000 = 100,000, "five hundred million" = 500 × 1,000,000)
    const hundredMagnitudeMatch = cleaned.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\s+hundred\s+(thousand|million)/i);
    if (hundredMagnitudeMatch) {
      const quantity = wordToNumber[hundredMagnitudeMatch[1].toLowerCase()] || 1;
      const magnitude = wordToNumber[hundredMagnitudeMatch[2].toLowerCase()] || 1;
      amount = quantity * 100 * magnitude;
    }
    
    // Priority 1B: Check for "X hundred" pattern (e.g., "one hundred", "five hundred")
    if (amount === 0) {
      const hundredMatch = cleaned.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\s+hundred(?!\s+(thousand|million))/i);
      if (hundredMatch) {
        const quantity = wordToNumber[hundredMatch[1].toLowerCase()] || 1;
        amount = quantity * 100;
      }
    }
    
    // Priority 2: Check for quantity word before magnitude (e.g., "пять тысяч" = 5 × 1000, "сто тысяч" = 100 × 1000)
    if (amount === 0) {
      // Build regex pattern from all base number words (excluding magnitudes and "hundred")
      const baseNumbers = Object.keys(wordToNumber).filter(word => 
        !['тысяча', 'тысячи', 'тысяч', 'тыс', 'миллион', 'миллиона', 'миллионов', 
          'thousand', 'million', 'hundred', 'k', 'к', 'm', 'м'].includes(word)
      );
      const basePattern = baseNumbers.join('|');
      const magnitudePattern = 'тысяч|тысячи|тысяча|тыс|миллион|миллиона|миллионов|thousand|million|k|к|m|м';
      
      const quantityMagnitudeRegex = new RegExp(`\\b(${basePattern})\\s+(${magnitudePattern})`, 'i');
      const quantityMagnitudeMatch = cleaned.match(quantityMagnitudeRegex);
      
      if (quantityMagnitudeMatch) {
        const quantityWord = quantityMagnitudeMatch[1].toLowerCase();
        const magnitudeWord = quantityMagnitudeMatch[2].toLowerCase();
        
        const quantity = wordToNumber[quantityWord] || 1;
        const magnitude = wordToNumber[magnitudeWord] || 1;
        
        amount = quantity * magnitude;
      }
    }
    
    // Priority 3: Try to find pure word number (e.g., "сто рублей", "пятнадцать")
    // But prioritize longer words first to avoid matching "one" in "one hundred"
    if (amount === 0) {
      const sortedWords = Object.entries(wordToNumber).sort((a, b) => b[0].length - a[0].length);
      for (const [word, value] of sortedWords) {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        if (cleaned.match(wordRegex)) {
          amount = value;
          break;
        }
      }
    }
    
    // If no word found, try digit + magnitude (e.g., "150 тысяч")
    if (amount === 0) {
      const digitMatch = cleaned.match(/(\d+(?:[.,]\d+)?)\s*(?:тысяч|тыс|thousand|k|к|миллион|million|m|м)?/i);
      if (digitMatch) {
        const baseAmount = parseFloat(digitMatch[1].replace(/,/g, ''));
        const fullMatch = digitMatch[0];
        
        // Apply magnitude multipliers
        if (fullMatch.match(/тысяч|тыс|thousand|k|к/i)) {
          amount = baseAmount * 1000;
        } else if (fullMatch.match(/миллион|million|m|м/i)) {
          amount = baseAmount * 1000000;
        } else {
          amount = baseAmount;
        }
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
