/**
 * AI-powered financial forecasting service using Anthropic Claude
 */

import Anthropic from "@anthropic-ai/sdk";
import { storage } from "../storage";
import type { Transaction, Recurring } from "@shared/schema";

interface ForecastDataPoint {
  date: string;
  predictedIncome: number;
  predictedExpense: number;
  predictedCapital: number;
}

/**
 * Generate financial forecast using AI
 * @param userId User ID
 * @param apiKey User's Anthropic API key (BYOK)
 * @param daysAhead Number of days to forecast
 * @param currentCapital Current total capital/net worth
 */
export async function generateForecast(
  userId: number,
  apiKey: string,
  daysAhead: number,
  currentCapital: number
): Promise<ForecastDataPoint[]> {
  if (!apiKey) {
    throw new Error("Anthropic API key not provided. Please add your API key in Settings.");
  }

  // Initialize Anthropic client with user's key
  const client = new Anthropic({ apiKey });

  // Get historical data (last 90 days)
  const historicalDays = 90;
  const historicalTransactions = await getHistoricalTransactions(userId, historicalDays);
  
  // Get recurring payments
  const recurringPayments = await storage.getRecurringByUserId(userId);
  const activeRecurring = recurringPayments.filter(r => r.isActive);

  // Calculate historical averages
  const stats = calculateHistoricalStats(historicalTransactions);

  // Prepare prompt for Claude
  const prompt = buildForecastPrompt(
    stats,
    activeRecurring,
    daysAhead,
    currentCapital
  );

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Invalid response from AI");
    }

    // Parse AI response (expecting JSON array)
    const forecast = JSON.parse(content.text);
    
    return forecast as ForecastDataPoint[];
  } catch (error: any) {
    console.error("Forecast generation failed:", error);
    
    // Fallback to simple linear forecast
    return generateSimpleForecast(
      daysAhead,
      stats.avgDailyIncome,
      stats.avgDailyExpense,
      currentCapital,
      activeRecurring
    );
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
 */
function generateSimpleForecast(
  daysAhead: number,
  avgIncome: number,
  avgExpense: number,
  currentCapital: number,
  recurring: Recurring[]
): ForecastDataPoint[] {
  const forecast: ForecastDataPoint[] = [];
  let runningCapital = currentCapital;

  const today = new Date();
  
  for (let i = 1; i <= daysAhead; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    const dateStr = forecastDate.toISOString().split('T')[0];

    // Calculate recurring for this date
    let recurringIncome = 0;
    let recurringExpense = 0;
    
    recurring.forEach(r => {
      if (shouldApplyRecurring(r, forecastDate)) {
        const amount = parseFloat(r.amount as unknown as string);
        if (r.type === 'income') {
          recurringIncome += amount;
        } else {
          recurringExpense += amount;
        }
      }
    });

    const dailyIncome = avgIncome + recurringIncome;
    const dailyExpense = avgExpense + recurringExpense;
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
