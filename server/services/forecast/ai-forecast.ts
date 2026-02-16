/**
 * AI-Powered Forecast Generator
 *
 * Uses Anthropic Claude to generate intelligent forecasts
 * Handles timeout, caching, and JSON parsing with fallback strategies
 * Junior-Friendly: <200 lines, focused on AI interaction
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Recurring } from "@shared/schema";
import type { ForecastDataPoint, ForecastResult, HistoricalStats, ForecastFilters } from "./types";
import { buildForecastPrompt } from "./prompt-builder";
import { buildForecastFromCache } from "./simple-forecast";
import {
  getAiForecastFromCache,
  setAiForecastCache,
} from "../ai-forecast-cache.service";
import { logInfo, logWarning, logError } from '../../lib/logger';

/**
 * Generate AI-powered forecast using Claude
 *
 * Features:
 * - 30s timeout with AbortController
 * - 12-hour caching
 * - Robust JSON parsing with 3 fallback strategies
 * - Dynamic token estimation based on forecast length
 *
 * @param userId User ID
 * @param apiKey User's Anthropic API key (BYOK)
 * @param daysAhead Number of days to forecast
 * @param currentCapital Current total capital/net worth
 * @param stats Historical statistics
 * @param activeRecurring Active recurring payments
 * @param filters Forecast filters (for cache key)
 * @param historicalDays Days of historical data used
 * @returns Forecast result with AI-generated data
 */
export async function generateAIForecast(
  userId: number,
  apiKey: string,
  daysAhead: number,
  currentCapital: number,
  stats: HistoricalStats,
  activeRecurring: Recurring[],
  filters: ForecastFilters = {},
  historicalDays: number
): Promise<ForecastResult> {
  // Check cache first (before making expensive API call)
  const cached = getAiForecastFromCache({
    userId,
    historyDays: historicalDays,
    forecastDays: daysAhead,
    useAI: true,
    ...filters,
  });

  if (cached) {
    logInfo(`[Forecast] Using cached AI forecast (expires: ${cached.expiresAt.toISOString()})`);
    const forecast = buildForecastFromCache(cached, currentCapital);
    return {
      forecast,
      metadata: {
        usedAI: true,
        fromCache: true,
        cacheExpiresAt: cached.expiresAt.toISOString(),
      },
    };
  }

  // Initialize Anthropic client with user's key
  const client = new Anthropic({ apiKey });

  // Prepare prompt for Claude
  const hasRecurringIncome = activeRecurring.some(r => r.type === 'income');
  const prompt = buildForecastPrompt(
    stats,
    activeRecurring,
    daysAhead,
    currentCapital,
    hasRecurringIncome
  );

  // Calculate required tokens based on forecast length
  // Each data point is ~150 chars, at ~3.5 chars/token = ~50 tokens per day
  // Add 1000 tokens buffer for JSON formatting and markdown wrappers
  const estimatedTokens = Math.max(4096, Math.min(32000, (daysAhead * 50) + 1000));

  logInfo(`[Forecast] Generating ${daysAhead} days AI forecast, max_tokens: ${estimatedTokens}`);

  // Create AbortController for request cancellation
  const controller = new AbortController();
  const timeoutMs = 30000; // 30 seconds

  // Set timeout to abort the request
  const timeoutId = setTimeout(() => {
    logWarning(`[Forecast] AI request timeout after ${timeoutMs}ms, aborting...`);
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
    logInfo(`[Forecast] AI response received, stop_reason: ${message.stop_reason}`);

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Invalid response from AI");
    }

    // Check if response was truncated
    if (message.stop_reason === 'max_tokens') {
      logError(`[Forecast] Response truncated! Requested ${estimatedTokens} tokens but hit limit`);
      throw new Error(`AI forecast was cut short. Try reducing forecast days or contact support.`);
    }

    // Parse AI response with robust fallback strategies
    const forecast = parseAIResponse(content.text);

    // Save to cache before returning
    const aiData = {
      dailyIncome: forecast.map(f => f.predictedIncome),
      dailyExpense: forecast.map(f => f.predictedExpense),
      dailyCapital: forecast.map(f => f.predictedCapital),
      baseCapital: currentCapital,
    };
    setAiForecastCache(
      {
        userId,
        historyDays: historicalDays,
        forecastDays: daysAhead,
        useAI: true,
        ...filters,
      },
      aiData
    );

    const cacheExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours
    return {
      forecast: forecast as ForecastDataPoint[],
      metadata: {
        usedAI: true,
        fromCache: false,
        cacheExpiresAt: cacheExpiresAt.toISOString(),
      },
    };
  } catch (innerError: unknown) {
    // Clear timeout on error
    clearTimeout(timeoutId);
    throw innerError;
  }
}

/**
 * Parse AI response with robust fallback strategies
 *
 * Strategy 1: Direct parse (clean JSON)
 * Strategy 2: Cleanup (remove newlines, spaces, trailing commas)
 * Strategy 3: Extraction (regex match JSON array)
 *
 * @param text Raw AI response text
 * @returns Parsed forecast data points
 */
function parseAIResponse(text: string): ForecastDataPoint[] {
  // Remove markdown code blocks if present
  let cleanedText = text.replace(/```json\n?|```\n?/g, '').trim();

  let forecast: ForecastDataPoint[];
  try {
    // Strategy 1: Direct parse (works for clean JSON)
    forecast = JSON.parse(cleanedText);
    logInfo(`[Forecast] Successfully parsed ${forecast.length} data points`);
    return forecast;
  } catch (parseError: unknown) {
    const msg = parseError instanceof Error ? parseError.message : String(parseError);
    logWarning('[Forecast] Direct JSON parse failed, trying cleanup strategies', { detail: msg });

    try {
      // Strategy 2: Clean up common JSON issues
      // Remove line breaks inside string values
      cleanedText = cleanedText.replace(/\n/g, ' ');
      // Remove multiple spaces
      cleanedText = cleanedText.replace(/\s+/g, ' ');
      // Fix trailing commas before closing brackets
      cleanedText = cleanedText.replace(/,\s*([\]}])/g, '$1');

      forecast = JSON.parse(cleanedText);
      logInfo(`[Forecast] Cleanup successful, parsed ${forecast.length} data points`);
      return forecast;
    } catch (cleanupError: unknown) {
      const msg = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
      logWarning('[Forecast] Cleanup strategy failed, trying JSON extraction', { detail: msg });

      try {
        // Strategy 3: Extract first valid JSON array from response
        const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          forecast = JSON.parse(jsonMatch[0]);
          logInfo(`[Forecast] Extraction successful, parsed ${forecast.length} data points`);
          return forecast;
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (extractError: unknown) {
        const msg = extractError instanceof Error ? extractError.message : String(extractError);
        logError('[Forecast] All JSON parsing strategies failed:', msg);
        logError('[Forecast] Raw response text:', text.substring(0, 500));
        logError('[Forecast] Response length:', text.length);
        throw new Error('AI response could not be parsed. The forecast data may be incomplete.');
      }
    }
  }
}
