import { DEFAULT_CATEGORY_EXPENSE, CATEGORY_KEYWORDS } from './config';
import { runOcr } from '../services/ocr/ocr-orchestrator';
import type { ParsedReceiptItem, ImageInput } from '../services/ocr/ocr-provider.types';
import { logInfo, logWarning, logError } from '../lib/logger';

export interface ReceiptData {
  amount: number;
  currency: string; // ANY ISO currency code (from OCR or heuristic)
  merchantName?: string;
  description?: string;
  date?: string;
  items?: ParsedReceiptItem[];
}

/**
 * Результат OCR обработки чека (поддерживает ЛЮБУЮ валюту)
 */
export interface ProcessedReceipt {
  amount: number;
  currency: string; // ANY ISO currency code
  description: string;
  category: string;
  type: 'expense';
  items?: ParsedReceiptItem[];
}

/**
 * Распознать чек через OCR (BYOK - использует API ключ пользователя)
 * Uses orchestrator with automatic fallback between providers.
 *
 * @param userId - ID пользователя (для загрузки API ключа из Settings)
 * @param imageBase64 - Изображение чека в base64
 * @param providedApiKey - Optional: Anthropic API key (if not provided, loads from user settings)
 * @param mimeType - MIME тип изображения
 * @returns Распознанные данные с товарами или null
 */
export async function processReceiptImage(
  userId: number,
  imageBase64: string,
  providedApiKey?: string,
  mimeType: string = 'image/jpeg'
): Promise<ProcessedReceipt | null> {
  try {
    logInfo('Starting OCR process', { userId });

    // 1. Use provided API key or load from user settings
    let anthropicKey = providedApiKey;

    if (!anthropicKey) {
      const { settingsRepository } = await import('../repositories/settings.repository');
      anthropicKey = await settingsRepository.getAnthropicApiKey(userId) ?? undefined;
    }

    // 2. Resolve system OpenAI key for fallback (controlled by env flag)
    const allowSystemKey = process.env.TELEGRAM_OCR_ALLOW_SYSTEM_KEY !== 'false'; // default: true
    let openaiKey: string | undefined;
    if (allowSystemKey) {
      const { getSystemKey } = await import('../services/api-key-manager');
      try { openaiKey = getSystemKey('openai'); } catch { /* no system key configured */ }
      if (openaiKey) {
        logInfo('TELEGRAM_OCR_SYSTEM_KEY_USED', {
          userId,
          provider: 'openai',
          reason: anthropicKey ? 'fallback available' : 'primary — no BYOK key',
        });
      }
    }

    if (!anthropicKey && !openaiKey) {
      logError('OCR failed: no API keys available (no BYOK key and no system key)', undefined, { userId });
      return null;
    }
    logInfo('API keys resolved', { userId, hasByokKey: !!anthropicKey, hasSystemFallback: !!openaiKey });
    logInfo('Image size', { bytes: imageBase64.length });

    // 3. Use orchestrator with fallback
    const validMimeType = mimeType as ImageInput['mimeType'];
    const imageInput: ImageInput[] = [{ base64: imageBase64, mimeType: validMimeType }];

    // Build key resolver: BYOK anthropic key + system OpenAI fallback
    const getKeyForProvider = (name: string): string | null => {
      if (name === 'anthropic' && anthropicKey) return anthropicKey;
      if (name === 'openai' && openaiKey) return openaiKey;
      return null;
    };

    logInfo('Calling OCR orchestrator...');
    const result = await runOcr(imageInput, validMimeType, getKeyForProvider);
    const parsedReceipt = result.receipt;

    logInfo('OCR_TG_COMPLETED', {
      userId,
      provider: result.provider,
      providersTried: result.providersTried,
      fallbackReason: result.fallbackReason,
      latencyMs: result.latencyMs,
      imageCount: 1,
      route: 'tg',
      merchant: parsedReceipt.merchant,
      total: parsedReceipt.total,
      itemsCount: parsedReceipt.items?.length || 0,
      currency: parsedReceipt.currency,
    });

    // 3. Определить валюту (приоритет):
    // 1. Claude OCR (parsedReceipt.currency) - HIGHEST (supports ANY ISO currency)
    // 2. Merchant name heuristic (mapCurrency) - FALLBACK
    const currency = parsedReceipt.currency || mapCurrency(parsedReceipt.merchant);
    logInfo('Currency detected', { currency, source: parsedReceipt.currency ? 'OCR' : 'merchant' });

    // 4. Определить категорию
    const category = detectCategory(parsedReceipt.merchant);
    logInfo('Category detected', { category });

    // 5. Вернуть результат с товарами
    logInfo('OCR completed successfully!');
    return {
      amount: parsedReceipt.total,
      currency,
      description: parsedReceipt.merchant,
      category,
      type: 'expense' as const,
      items: parsedReceipt.items || [],
    };

  } catch (error) {
    logError('OCR Error Details:', {
      userId,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      imageSize: imageBase64.length
    });
    return null;
  }
}

/**
 * Определить валюту по названию магазина (эвристика)
 * Возвращает ISO currency code
 */
function mapCurrency(merchantName: string): string {
  const lower = merchantName.toLowerCase();

  // Индонезийские магазины
  if (lower.includes('pepito') || lower.includes('indomaret') || lower.includes('alfamart')) {
    return 'IDR';
  }

  // По умолчанию USD (универсальный fallback)
  return 'USD';
}

/**
 * Определить категорию по названию магазина
 */
function detectCategory(text?: string): string {
  if (!text) return DEFAULT_CATEGORY_EXPENSE;

  const lower = text.toLowerCase();

  // Известные магазины
  const stores: Record<string, string> = {
    'pepito': 'Food & Drinks',
    'indomaret': 'Food & Drinks',
    'alfamart': 'Food & Drinks',
    'starbucks': 'Food & Drinks',
    'kfc': 'Food & Drinks',
    'mcdonald': 'Food & Drinks',
    'grab': 'Transport',
    'gojek': 'Transport',
    'tokopedia': 'Shopping',
    'shopee': 'Shopping',
  };

  for (const [name, category] of Object.entries(stores)) {
    if (lower.includes(name)) {
      return category;
    }
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  return DEFAULT_CATEGORY_EXPENSE;
}
