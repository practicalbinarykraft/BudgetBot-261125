/**
 * AI-powered financial forecasting service using Anthropic Claude
 */

import Anthropic from "@anthropic-ai/sdk";
import { storage } from "../storage";
import type { Transaction, Recurring } from "@shared/schema";
import {
  getAiForecastFromCache,
  setAiForecastCache,
} from "./ai-forecast-cache.service";

interface ForecastDataPoint {
  date: string;
  predictedIncome: number;
  predictedExpense: number;
  predictedCapital: number;
}

export interface ForecastResult {
  forecast: ForecastDataPoint[];
  metadata: {
    usedAI: boolean;
    fromCache: boolean;
    cacheExpiresAt: string | null; // ISO string for JSON serialization
  };
}

/**
 * Generate financial forecast
 * @param userId User ID
 * @param apiKey User's Anthropic API key (BYOK)
 * @param daysAhead Number of days to forecast
 * @param currentCapital Current total capital/net worth
 * @param useAI Whether to use AI forecast (opt-in, default: false)
 * @param filters Forecast filters (for cache key)
 */
export async function generateForecast(
  userId: number,
  apiKey: string,
  daysAhead: number,
  currentCapital: number,
  useAI: boolean = false,
  filters?: {
    includeRecurringIncome?: boolean;
    includeRecurringExpense?: boolean;
    includePlannedIncome?: boolean;
    includePlannedExpenses?: boolean;
    includeBudgetLimits?: boolean;
  }
): Promise<ForecastResult> {
  // Get historical data (last 90 days)
  const historicalDays = 90;
  const historicalTransactions = await getHistoricalTransactions(userId, historicalDays);
  
  // Get recurring payments
  const recurringPayments = await storage.getRecurringByUserId(userId);
  const activeRecurring = recurringPayments.filter(r => r.isActive);

  // Calculate historical averages
  const stats = calculateHistoricalStats(historicalTransactions);

  // If useAI=false or no API key, use simple forecast immediately
  if (!useAI || !apiKey) {
    const reason = !useAI ? 'AI forecast not requested (opt-in)' : 'No API key provided';
    console.log(`[Forecast] ${reason}, using simple linear forecast`);
    
    // Check if user has any recurring income sources
    const hasRecurringIncome = activeRecurring.some(r => r.type === 'income');
    
    const forecast = generateSimpleForecast(
      daysAhead,
      stats.avgDailyIncome,
      stats.avgDailyExpense,
      currentCapital,
      hasRecurringIncome
    );
    return {
      forecast,
      metadata: {
        usedAI: false,
        fromCache: false,
        cacheExpiresAt: null,
      },
    };
  }

  // Check cache first (before making expensive API call)
  const cached = getAiForecastFromCache({ 
    userId, 
    historyDays: historicalDays, 
    forecastDays: daysAhead,
    useAI, // Include useAI in cache key
    ...filters, // Include filters in cache key
  });
  if (cached) {
    console.log(`[Forecast] Using cached AI forecast (expires: ${cached.expiresAt.toISOString()})`);
    const forecast = buildForecastFromCache(cached, currentCapital);
    return {
      forecast,
      metadata: {
        usedAI: true,
        fromCache: true,
        cacheExpiresAt: cached.expiresAt.toISOString(), // Convert Date to ISO string
      },
    };
  }

  // Try AI forecast with AbortController-based timeout
  try {
    // Initialize Anthropic client with user's key
    const client = new Anthropic({ apiKey });

    // Prepare prompt for Claude
    const prompt = buildForecastPrompt(
      stats,
      activeRecurring,
      daysAhead,
      currentCapital
    );

    // Calculate required tokens based on forecast length
    // Each data point is ~150 chars, at ~3.5 chars/token = ~50 tokens per day
    // Add 1000 tokens buffer for JSON formatting and markdown wrappers
    const estimatedTokens = Math.max(4096, Math.min(32000, (daysAhead * 50) + 1000));

    console.log(`[Forecast] Generating ${daysAhead} days AI forecast, max_tokens: ${estimatedTokens}`);

    // Create AbortController for request cancellation
    const controller = new AbortController();
    const timeoutMs = 30000; // 30 seconds
    
    // Set timeout to abort the request
    const timeoutId = setTimeout(() => {
      console.warn(`[Forecast] AI request timeout after ${timeoutMs}ms, aborting...`);
      controller.abort();
    }, timeoutMs);

    try {
      const message = await client.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: estimatedTokens,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }, {
        signal: controller.signal as AbortSignal,
      });

      // Clear timeout on success
      clearTimeout(timeoutId);
      console.log(`[Forecast] AI response received, stop_reason: ${message.stop_reason}`);

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Invalid response from AI");
    }

    // Check if response was truncated
    if (message.stop_reason === 'max_tokens') {
      console.error(`[Forecast] Response truncated! Requested ${estimatedTokens} tokens but hit limit`);
      throw new Error(`AI forecast was cut short. Try reducing forecast days or contact support.`);
    }

    // Parse AI response (expecting JSON array)
    // Remove markdown code blocks if present
    let cleanedText = content.text.replace(/```json\n?|```\n?/g, '').trim();
    
    // Robust JSON parsing with multiple fallback strategies
    let forecast: ForecastDataPoint[];
    try {
      // Strategy 1: Direct parse (works for clean JSON)
      forecast = JSON.parse(cleanedText);
      console.log(`[Forecast] Successfully parsed ${forecast.length} data points`);
    } catch (parseError: any) {
      console.warn('[Forecast] Direct JSON parse failed, trying cleanup strategies:', parseError.message);
      
      try {
        // Strategy 2: Clean up common JSON issues
        // Remove line breaks inside string values
        cleanedText = cleanedText.replace(/\n/g, ' ');
        // Remove multiple spaces
        cleanedText = cleanedText.replace(/\s+/g, ' ');
        // Fix trailing commas before closing brackets
        cleanedText = cleanedText.replace(/,\s*([\]}])/g, '$1');
        
        forecast = JSON.parse(cleanedText);
        console.log(`[Forecast] Cleanup successful, parsed ${forecast.length} data points`);
      } catch (cleanupError: any) {
        console.warn('[Forecast] Cleanup strategy failed, trying JSON extraction:', cleanupError.message);
        
        try {
          // Strategy 3: Extract first valid JSON array from response
          const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            forecast = JSON.parse(jsonMatch[0]);
            console.log(`[Forecast] Extraction successful, parsed ${forecast.length} data points`);
          } else {
            throw new Error('No JSON array found in response');
          }
        } catch (extractError: any) {
          console.error('[Forecast] All JSON parsing strategies failed:', extractError.message);
          console.error('[Forecast] Raw response text:', content.text.substring(0, 500));
          console.error('[Forecast] Response length:', content.text.length);
          throw new Error('AI response could not be parsed. The forecast data may be incomplete.');
        }
      }
    }
    
    // Save to cache before returning (with capital + baseCapital for offset calculation)
    const aiData = {
      dailyIncome: forecast.map(f => f.predictedIncome),
      dailyExpense: forecast.map(f => f.predictedExpense),
      dailyCapital: forecast.map(f => f.predictedCapital),
      baseCapital: currentCapital, // Save current capital for offset calculation
    };
    setAiForecastCache(
      { 
        userId, 
        historyDays: historicalDays, 
        forecastDays: daysAhead,
        useAI, // Include useAI in cache key
        ...filters, // Include filters in cache key
      },
      aiData
    );

    const cacheExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
    return {
      forecast: forecast as ForecastDataPoint[],
      metadata: {
        usedAI: true,
        fromCache: false,
        cacheExpiresAt: cacheExpiresAt.toISOString(), // Convert Date to ISO string
      },
    };
    } catch (innerError: any) {
      // Clear timeout on error
      clearTimeout(timeoutId);
      throw innerError;
    }
  } catch (error: any) {
    const isTimeout = error.name === 'AbortError' || error.message?.includes('timeout');
    if (isTimeout) {
      console.warn('[Forecast] AI request timed out after 30s, using simple forecast');
    } else {
      console.error('[Forecast] AI forecast failed:', error.message);
    }
    
    // Fallback to simple linear forecast
    const hasRecurringIncome = activeRecurring.some(r => r.type === 'income');
    const forecast = generateSimpleForecast(
      daysAhead,
      stats.avgDailyIncome,
      stats.avgDailyExpense,
      currentCapital,
      hasRecurringIncome
    );
    return {
      forecast,
      metadata: {
        usedAI: false,
        fromCache: false,
        cacheExpiresAt: null,
      },
    };
  }
}

/**
 * Get historical transactions for analysis
 */
async function getHistoricalTransactions(
  userId: number,
  days: number
): Promise<Transaction[]> {
  const transactions = await storage.getTransactionsByUserId(userId);
  
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return transactions.filter(t => new Date(t.date) >= cutoffDate);
}

/**
 * Calculate historical statistics
 */
function calculateHistoricalStats(transactions: Transaction[]) {
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amountUsd as unknown as string),
    0
  );
  const totalExpense = expenseTransactions.reduce(
    (sum, t) => sum + parseFloat(t.amountUsd as unknown as string),
    0
  );

  const days = transactions.length > 0 ? 90 : 1; // Avoid division by zero

  return {
    avgDailyIncome: totalIncome / days,
    avgDailyExpense: totalExpense / days,
    totalIncome,
    totalExpense,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length,
  };
}

/**
 * Build prompt for Claude
 */
function buildForecastPrompt(
  stats: ReturnType<typeof calculateHistoricalStats>,
  recurring: Recurring[],
  daysAhead: number,
  currentCapital: number
): string {
  const recurringInfo = recurring.map(r => ({
    type: r.type,
    amount: parseFloat(r.amount as unknown as string),
    description: r.description,
    frequency: r.frequency,
    nextDate: r.nextDate,
  }));

  return `You are a financial forecasting AI. Generate a ${daysAhead}-day financial forecast based on the following data:

**Historical Data (last 90 days):**
- Average daily income: $${stats.avgDailyIncome.toFixed(2)}
- Average daily expense: $${stats.avgDailyExpense.toFixed(2)}
- Total income: $${stats.totalIncome.toFixed(2)}
- Total expense: $${stats.totalExpense.toFixed(2)}
- Income transactions: ${stats.incomeCount}
- Expense transactions: ${stats.expenseCount}

**Recurring Payments:**
${JSON.stringify(recurringInfo, null, 2)}

**Current Capital:** $${currentCapital.toFixed(2)}

**Task:**
Generate a ${daysAhead}-day forecast with daily predictions for income, expenses, and capital (net worth).

**Important Rules:**
1. Account for recurring payments based on their frequency
2. Use historical averages as baseline
3. Capital = Previous Day Capital + Income - Expenses
4. Return ONLY a JSON array, no explanations

**Expected Format:**
[
  {
    "date": "2024-11-12",
    "predictedIncome": 0,
    "predictedExpense": 45.50,
    "predictedCapital": 1250.00
  },
  ...
]

Start from tomorrow and forecast ${daysAhead} days ahead. Return pure JSON array.`;
}

/**
 * Fallback: Simple linear forecast without AI
 * Returns BASE forecast using historical expense averages
 * Income baseline is only used when user has recurring income sources
 * Filters (recurring, planned, budget) are applied separately in trend-calculator
 */
function generateSimpleForecast(
  daysAhead: number,
  avgIncome: number,
  avgExpense: number,
  currentCapital: number,
  hasRecurringIncome: boolean
): ForecastDataPoint[] {
  const forecast: ForecastDataPoint[] = [];
  let runningCapital = currentCapital;

  const today = new Date();
  
  for (let i = 1; i <= daysAhead; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    const dateStr = forecastDate.toISOString().split('T')[0];

    // Use historical expense average as baseline
    // For income: only use historical average if user has recurring income sources
    // Otherwise income stays flat (0) until recurring/planned filters add income
    const dailyIncome = hasRecurringIncome ? avgIncome : 0;
    const dailyExpense = avgExpense;
    runningCapital = runningCapital + dailyIncome - dailyExpense;

    forecast.push({
      date: dateStr,
      predictedIncome: dailyIncome,
      predictedExpense: dailyExpense,
      predictedCapital: runningCapital,
    });
  }

  return forecast;
}

/**
 * Build forecast from cached AI data
 * IMPORTANT: Recalculates capital from currentCapital using cached income/expense
 * to ensure continuity with historical data regardless of base capital changes.
 * 
 * Why not use cached capital directly:
 * - If user makes transactions after caching, currentCapital changes
 * - If user makes historical transactions, capitalAtPeriodStart changes
 * - Simple offset doesn't account for these changes → discontinuity
 * 
 * Solution: Recalculate capital from currentCapital as running sum of income - expense
 * Note: May deviate slightly from AI's capital if AI used non-linear patterns,
 * but ensures smooth continuity with historical data.
 */
function buildForecastFromCache(
  cached: {
    dailyIncome: number[];
    dailyExpense: number[];
    dailyCapital: number[]; // Not used, kept for reference
    baseCapital: number; // Not used
    expiresAt: Date;
  },
  currentCapital: number
): ForecastDataPoint[] {
  const forecast: ForecastDataPoint[] = [];
  const today = new Date();
  let runningCapital = currentCapital; // Start from current capital

  for (let i = 0; i < cached.dailyIncome.length; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i + 1);
    const dateStr = forecastDate.toISOString().split('T')[0];

    const income = cached.dailyIncome[i] || 0;
    const expense = cached.dailyExpense[i] || 0;
    runningCapital = runningCapital + income - expense; // Recalculate capital

    forecast.push({
      date: dateStr,
      predictedIncome: income,
      predictedExpense: expense,
      predictedCapital: runningCapital,
    });
  }

  return forecast;
}

/**
 * Check if recurring payment applies to given date
 */
function shouldApplyRecurring(recurring: Recurring, date: Date): boolean {
  const nextDate = new Date(recurring.nextDate);
  
  if (date < nextDate) {
    return false;
  }

  const daysDiff = Math.floor(
    (date.getTime() - nextDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  switch (recurring.frequency) {
    case 'weekly':
      return daysDiff % 7 === 0;
    case 'monthly':
      return date.getDate() === nextDate.getDate();
    case 'yearly':
      return (
        date.getDate() === nextDate.getDate() &&
        date.getMonth() === nextDate.getMonth()
      );
    default:
      return false;
  }
}
