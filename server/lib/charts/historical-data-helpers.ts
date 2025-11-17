import type { Transaction } from "@shared/schema";
import { generateDateRange } from "./chart-formatters";

export interface TrendDataPoint {
  date: string;
  income: number;
  expense: number;
  capital: number;
  isToday: boolean;
  isForecast: boolean;
}

export function calculateHistoricalData(
  transactions: Transaction[],
  historyDays: number
): TrendDataPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const historyStart = new Date(today);
  historyStart.setDate(today.getDate() - historyDays);
  const historyStartStr = historyStart.toISOString().split('T')[0];

  const filteredTransactions = transactions.filter(t => 
    t.date >= historyStartStr && t.date <= todayStr
  );

  if (filteredTransactions.length === 0) {
    return [];
  }

  const dateRange = generateDateRange(historyStart, today);
  const historicalData: TrendDataPoint[] = [];

  for (const dateStr of dateRange) {
    const dayTransactions = filteredTransactions.filter(t => t.date === dateStr);
    
    const dayIncome = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amountUsd as unknown as string), 0);
    
    const dayExpense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amountUsd as unknown as string), 0);

    historicalData.push({
      date: dateStr,
      income: dayIncome,
      expense: dayExpense,
      capital: 0,
      isToday: dateStr === todayStr,
      isForecast: false,
    });
  }

  return historicalData;
}

export function makeCumulativeFromBase<T extends { income: number; expense: number }>(
  dataPoints: T[],
  baseIncome: number,
  baseExpense: number
): T[] {
  let cumulativeIncome = baseIncome;
  let cumulativeExpense = baseExpense;

  return dataPoints.map((point) => {
    cumulativeIncome += point.income || 0;
    cumulativeExpense += point.expense || 0;

    return {
      ...point,
      income: cumulativeIncome,
      expense: cumulativeExpense,
    };
  });
}
