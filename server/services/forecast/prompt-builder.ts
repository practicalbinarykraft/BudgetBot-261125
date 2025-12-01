/**
 * AI Prompt Builder for Forecasting
 *
 * Builds prompts for Claude AI to generate forecasts
 * Junior-Friendly: <90 lines, focused on prompt construction
 */

import type { Recurring } from "@shared/schema";
import type { HistoricalStats } from "./types";

/**
 * Build prompt for Claude AI forecast generation
 *
 * Creates detailed prompt with historical data, recurring payments,
 * and specific instructions for income/expense forecasting
 *
 * @param stats Historical statistics
 * @param recurring Active recurring payments
 * @param daysAhead Number of days to forecast
 * @param currentCapital Current total capital/net worth
 * @param hasRecurringIncome Whether user has recurring income sources
 * @returns Formatted prompt string for Claude
 */
export function buildForecastPrompt(
  stats: HistoricalStats,
  recurring: Recurring[],
  daysAhead: number,
  currentCapital: number,
  hasRecurringIncome: boolean
): string {
  const recurringInfo = recurring.map(r => ({
    type: r.type,
    amount: parseFloat(r.amount as unknown as string),
    description: r.description,
    frequency: r.frequency,
    nextDate: r.nextDate,
  }));

  const incomeInstructions = hasRecurringIncome
    ? `**Income Forecast Rules:**
- Use historical income average ($${stats.avgDailyIncome.toFixed(2)}/day) as baseline for daily income
- Add recurring income payments based on their frequency and schedule`
    : `**Income Forecast Rules:**
- IGNORE historical income averages - user has no active recurring income sources
- Predicted income should be 0 for all days UNLESS a specific recurring income payment occurs
- Historical income data is provided for context only - do NOT use it as baseline`;

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

${incomeInstructions}

**Expense Forecast Rules:**
- Use historical expense average ($${stats.avgDailyExpense.toFixed(2)}/day) as baseline
- Add recurring expense payments based on their frequency and schedule

**Task:**
Generate a ${daysAhead}-day forecast with daily predictions for income, expenses, and capital (net worth).

**Important Rules:**
1. Follow the Income and Expense Forecast Rules above strictly
2. Capital = Previous Day Capital + Income - Expenses
3. Return ONLY a JSON array, no explanations

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
