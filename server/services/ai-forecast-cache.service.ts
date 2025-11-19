import NodeCache from 'node-cache';

/**
 * AI Forecast Cache Service
 * 
 * Кеширует AI прогнозы на 12 часов чтобы избежать повторных платных запросов к Anthropic API.
 * Ключ кеша: userId + параметры прогноза
 */

interface AiForecastCacheData {
  dailyIncome: number[];
  dailyExpense: number[];
  dailyCapital: number[]; // Capital values from AI forecast
  baseCapital: number; // Capital at time of forecast generation (for offset calculation)
  generatedAt: Date;
  expiresAt: Date;
}

// TTL = 12 часов (43200 секунд)
const AI_CACHE_TTL = 12 * 60 * 60;

// In-memory cache
const cache = new NodeCache({ 
  stdTTL: AI_CACHE_TTL,
  checkperiod: 600, // Проверка expired keys каждые 10 минут
  useClones: false  // Возвращать ссылки для скорости
});

/**
 * Генерирует ключ кеша на основе параметров прогноза
 * ВАЖНО: включает ВСЕ параметры влияющие на прогноз (фильтры)
 */
function generateCacheKey(params: {
  userId: number;
  historyDays: number;
  forecastDays: number;
  useAI?: boolean;
  includeRecurringIncome?: boolean;
  includeRecurringExpense?: boolean;
  includePlannedIncome?: boolean;
  includePlannedExpenses?: boolean;
  includeBudgetLimits?: boolean;
}): string {
  const {
    userId,
    historyDays,
    forecastDays,
    useAI = false,
    includeRecurringIncome = true,
    includeRecurringExpense = true,
    includePlannedIncome = true,
    includePlannedExpenses = true,
    includeBudgetLimits = false,
  } = params;
  
  return `ai:${userId}:h${historyDays}:f${forecastDays}:useAI${useAI}:ri${includeRecurringIncome}:re${includeRecurringExpense}:pi${includePlannedIncome}:pe${includePlannedExpenses}:bl${includeBudgetLimits}`;
}

/**
 * Получить AI прогноз из кеша
 * @returns Cached forecast или null если не найден
 */
export function getAiForecastFromCache(params: {
  userId: number;
  historyDays: number;
  forecastDays: number;
  useAI?: boolean;
  includeRecurringIncome?: boolean;
  includeRecurringExpense?: boolean;
  includePlannedIncome?: boolean;
  includePlannedExpenses?: boolean;
  includeBudgetLimits?: boolean;
}): AiForecastCacheData | null {
  const key = generateCacheKey(params);
  const cached = cache.get<AiForecastCacheData>(key);
  
  if (cached) {
    console.log(`[AI Cache] HIT for user ${params.userId} (expires: ${cached.expiresAt.toISOString()})`);
    return cached;
  }
  
  console.log(`[AI Cache] MISS for user ${params.userId}`);
  return null;
}

/**
 * Сохранить AI прогноз в кеш
 */
export function setAiForecastCache(
  params: {
    userId: number;
    historyDays: number;
    forecastDays: number;
    useAI?: boolean;
    includeRecurringIncome?: boolean;
    includeRecurringExpense?: boolean;
    includePlannedIncome?: boolean;
    includePlannedExpenses?: boolean;
    includeBudgetLimits?: boolean;
  },
  data: {
    dailyIncome: number[];
    dailyExpense: number[];
    dailyCapital: number[];
    baseCapital: number; // Capital at time of forecast generation
  }
): void {
  const key = generateCacheKey(params);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AI_CACHE_TTL * 1000);
  
  const cacheData: AiForecastCacheData = {
    dailyIncome: data.dailyIncome,
    dailyExpense: data.dailyExpense,
    dailyCapital: data.dailyCapital,
    baseCapital: data.baseCapital,
    generatedAt: now,
    expiresAt
  };
  
  cache.set(key, cacheData);
  console.log(`[AI Cache] SET for user ${params.userId} (expires: ${expiresAt.toISOString()})`);
}

/**
 * Очистить кеш для конкретного пользователя (опционально)
 */
export function clearAiForecastCache(userId: number): void {
  const keys = cache.keys();
  const userKeys = keys.filter((key: string) => key.startsWith(`ai-forecast:${userId}:`));
  
  userKeys.forEach((key: string) => cache.del(key));
  console.log(`[AI Cache] CLEARED ${userKeys.length} entries for user ${userId}`);
}

/**
 * Получить статистику кеша
 */
export function getAiCacheStats() {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
}
