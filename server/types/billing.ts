/**
 * Billing system types and constants
 *
 * Manages AI API credits, pricing, and provider routing
 */

export type AIProvider = 'anthropic' | 'openai' | 'openrouter' | 'deepseek';

export type AIOperation =
  | 'ocr'                    // OCR receipt scanning (Claude Vision)
  | 'voice_transcription'    // Whisper speech-to-text
  | 'voice_normalization'    // AI-powered transaction normalization from voice
  | 'financial_advisor'      // AI financial chat advisor
  | 'categorization'         // Auto-categorize transactions
  | 'text_parsing';          // Parse transaction text with AI

export interface ApiKeyResult {
  provider: AIProvider;
  key: string;
  billingMode: 'user' | 'system' | 'free';
  shouldCharge: boolean;
  userId?: number;
}

export interface TokenUsage {
  input: number;
  output: number;
}

export interface CreditCost {
  operation: AIOperation;
  provider: AIProvider;
  tokens: TokenUsage;
  credits: number;
  costUSD: number;
}

/**
 * Smart routing strategy: choose optimal provider for each operation
 *
 * Priority:
 * 1. Quality (Claude/GPT for complex tasks)
 * 2. Cost (DeepSeek for simple tasks)
 * 3. Specialization (Whisper for speech)
 */
export const OPERATION_ROUTING: Record<AIOperation, AIProvider> = {
  ocr: 'anthropic',                    // Claude Vision - best quality
  voice_transcription: 'openai',       // Whisper - specialized
  voice_normalization: 'deepseek',     // Simple task - save money
  financial_advisor: 'anthropic',      // Complex reasoning - best quality
  categorization: 'deepseek',          // Pattern matching - cheap is fine
  text_parsing: 'deepseek',            // Structured extraction - cheap is fine
};

/**
 * Pricing per 1M tokens (in USD)
 * Updated: January 2025
 */
export const AI_PRICING: Record<AIProvider, { input: number; output: number }> = {
  anthropic: {
    input: 3.00,    // Claude 3.5 Sonnet
    output: 15.00,
  },
  openai: {
    input: 2.50,    // GPT-4o
    output: 10.00,
  },
  deepseek: {
    input: 0.27,    // DeepSeek V3 - 12x cheaper!
    output: 1.10,
  },
  openrouter: {
    input: 3.00,    // Varies by model, using Claude pricing as default
    output: 15.00,
  },
};

/**
 * Special pricing for operations that don't use tokens
 */
export const SPECIAL_PRICING = {
  voice_transcription_per_minute: 0.006, // OpenAI Whisper
};

/**
 * Credit costs for common operations
 * 1 credit = ~$0.01 in actual cost (with margin)
 */
export const OPERATION_CREDIT_COSTS: Record<AIOperation, number> = {
  voice_transcription: 1,      // ~30 sec voice message
  voice_normalization: 1,      // DeepSeek parsing
  ocr: 1,                      // Claude Vision
  financial_advisor: 2,        // Claude/GPT response
  categorization: 1,           // DeepSeek categorization
  text_parsing: 1,             // DeepSeek parsing
};

/**
 * Pricing tiers
 */
export const PRICING_TIERS = {
  free: {
    name: 'Free',
    monthlyPrice: 0,
    credits: 25,
    features: [
      '25 AI operations/month',
      'Voice transcription',
      'OCR receipt scanning',
      'Basic AI chat',
      'Community support',
    ],
  },
  basic: {
    name: 'Basic',
    monthlyPrice: 5,
    credits: 200,
    features: [
      '200 AI operations/month',
      'All Free features',
      'Priority support',
      'Data export',
      'Advanced analytics',
    ],
    popular: true,
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 12,
    credits: 500,
    features: [
      '500 AI operations/month',
      'All Basic features',
      'API access',
      'Custom categories',
      'Advanced reports',
    ],
  },
  mega: {
    name: 'Mega',
    monthlyPrice: 20,
    credits: 1000,
    features: [
      '1000 AI operations/month',
      'All Pro features',
      'Dedicated support',
      'Custom integrations',
    ],
  },
  byok: {
    name: 'BYOK',
    monthlyPrice: 0,
    credits: Infinity,
    features: [
      'Unlimited operations',
      'Use your own API keys',
      'Full cost control',
      'All features unlocked',
    ],
    requiresKeys: true,
  },
} as const;

/**
 * Rate limits per tier (requests per hour)
 */
export const RATE_LIMITS = {
  free: { max: 10, window: 3600 },      // 10 per hour
  basic: { max: 50, window: 3600 },     // 50 per hour
  pro: { max: 200, window: 3600 },      // 200 per hour
  mega: { max: 500, window: 3600 },     // 500 per hour
  byok: { max: 1000, window: 3600 },    // 1000 per hour
} as const;

/**
 * Monthly hard caps (safety limits)
 */
export const MONTHLY_CAPS = {
  free: 25,
  basic: 250,   // 25% buffer
  pro: 625,     // 25% buffer
  mega: 1250,   // 25% buffer
  byok: Infinity,
} as const;

/**
 * Operation pricing information for UI
 * Shows users what each action costs
 */
export const OPERATION_PRICING = {
  voice_transcription: {
    name: 'Voice Message',
    nameRu: 'Голосовое сообщение',
    icon: '🎤',
    credits: 1,
    description: 'Transcribe voice to text with AI normalization',
    descriptionRu: 'Расшифровка голоса в текст с AI обработкой',
    example: '30 sec voice → transaction',
    exampleRu: '30 сек голосовое → транзакция',
  },
  ocr: {
    name: 'Receipt Scan (OCR)',
    nameRu: 'Сканирование чека (OCR)',
    icon: '📸',
    credits: 3,
    description: 'Extract transaction from receipt photo',
    descriptionRu: 'Извлечение транзакции из фото чека',
    example: 'Photo → amount, merchant, items',
    exampleRu: 'Фото → сумма, магазин, товары',
  },
  financial_advisor: {
    name: 'AI Financial Chat',
    nameRu: 'AI Финансовый Чат',
    icon: '💬',
    credits: 3,
    description: 'Chat with AI about your finances',
    descriptionRu: 'Общение с AI о ваших финансах',
    example: 'Ask questions, get advice',
    exampleRu: 'Вопросы, советы по бюджету',
  },
  categorization: {
    name: 'Auto-categorization',
    nameRu: 'Авто-категоризация',
    icon: '🏷️',
    credits: 1,
    description: 'AI categorizes your transactions',
    descriptionRu: 'AI автоматически категоризирует',
    example: 'Starbucks → Food & Drinks',
    exampleRu: 'Starbucks → Еда и напитки',
  },
  text_parsing: {
    name: 'Smart Text Parsing',
    nameRu: 'Умный парсинг текста',
    icon: '✍️',
    credits: 1,
    description: 'Parse transaction from any text',
    descriptionRu: 'Извлечение транзакции из текста',
    example: '"bought coffee 5$" → transaction',
    exampleRu: '"купил кофе 300р" → транзакция',
  },
} as const;

export class BillingError extends Error {
  constructor(
    message: string,
    public code: 'INSUFFICIENT_CREDITS' | 'NO_API_KEY' | 'RATE_LIMIT' | 'MONTHLY_CAP',
    public userId?: number
  ) {
    super(message);
    this.name = 'BillingError';
  }
}
