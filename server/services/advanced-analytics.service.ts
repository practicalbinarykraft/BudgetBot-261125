/**
 * Advanced Analytics Service
 *
 * Provides spending forecasts, budget recommendations, and trend analysis
 */

import { db } from '../db';
import { transactions, budgets } from '@shared/schema';
import { eq, and, gte, lte, sum, count, sql } from 'drizzle-orm';
import logger from '../lib/logger';

/**
 * Calculate spending forecast for next month
 */
export async function getSpendingForecast(userId: number) {
  try {
    // Get last 3 months of spending
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const result = await db
      .select({
        month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, threeMonthsAgo.toISOString().split('T')[0])
        )
      )
      .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`);

    if (result.length === 0) {
      return {
        forecast: 0,
        confidence: 'low',
        trend: 'stable',
        historicalAverage: 0,
      };
    }

    // Calculate average and trend
    const amounts = result.map(r => parseFloat(r.total || '0'));
    const average = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Simple linear trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (amounts.length >= 2) {
      const lastMonth = amounts[amounts.length - 1];
      const secondLast = amounts[amounts.length - 2];
      const change = ((lastMonth - secondLast) / secondLast) * 100;

      if (change > 5) trend = 'increasing';
      else if (change < -5) trend = 'decreasing';
    }

    // Forecast = average + trend adjustment
    const trendMultiplier = trend === 'increasing' ? 1.1 : trend === 'decreasing' ? 0.9 : 1;
    const forecast = average * trendMultiplier;

    return {
      forecast: Math.round(forecast * 100) / 100,
      confidence: amounts.length >= 3 ? 'high' : 'medium',
      trend,
      historicalAverage: Math.round(average * 100) / 100,
      monthlyData: result.map(r => ({
        month: r.month,
        amount: parseFloat(r.total || '0'),
      })),
    };
  } catch (error: any) {
    logger.error('Failed to calculate spending forecast', {
      error: error.message,
      userId,
    });
    throw error;
  }
}

/**
 * Get budget recommendations based on spending patterns
 */
export async function getBudgetRecommendations(userId: number) {
  try {
    // Get spending by category for last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const spendingByCategory = await db
      .select({
        category: transactions.category,
        categoryId: transactions.categoryId,
        total: sum(transactions.amount),
        count: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, threeMonthsAgo.toISOString().split('T')[0])
        )
      )
      .groupBy(transactions.category, transactions.categoryId);

    // Get current budgets
    const currentBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId));

    const recommendations = spendingByCategory.map(spending => {
      const categoryId = spending.categoryId;
      const categoryName = spending.category || 'Uncategorized';
      const monthlyAverage = parseFloat(spending.total || '0') / 3;

      const currentBudget = currentBudgets.find(b => b.categoryId === categoryId);
      const currentLimit = currentBudget ? parseFloat(currentBudget.limitAmount) : 0;

      // Recommend 110% of average spending
      const recommendedBudget = Math.ceil(monthlyAverage * 1.1);

      let status: 'good' | 'too_low' | 'too_high' | 'no_budget' = 'good';
      let message = '';

      if (!currentBudget) {
        status = 'no_budget';
        message = `Consider setting a budget of $${recommendedBudget} for ${categoryName}`;
      } else if (currentLimit < monthlyAverage * 0.9) {
        status = 'too_low';
        message = `Your budget is too tight. Consider increasing to $${recommendedBudget}`;
      } else if (currentLimit > monthlyAverage * 1.5) {
        status = 'too_high';
        message = `You have room to reduce budget to $${recommendedBudget}`;
      } else {
        message = `Budget looks good for ${categoryName}`;
      }

      return {
        categoryId,
        categoryName,
        monthlyAverage: Math.round(monthlyAverage * 100) / 100,
        currentBudget: currentLimit,
        recommendedBudget,
        status,
        message,
      };
    });

    return recommendations;
  } catch (error: any) {
    logger.error('Failed to get budget recommendations', {
      error: error.message,
      userId,
    });
    throw error;
  }
}

/**
 * Get spending trends and insights
 */
export async function getSpendingTrends(userId: number) {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Monthly spending trend
    const monthlyTrend = await db
      .select({
        month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`,
        total: sum(transactions.amount),
        count: count(),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, sixMonthsAgo.toISOString().split('T')[0])
        )
      )
      .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${transactions.date}, 'YYYY-MM')`);

    // Category breakdown
    const categoryBreakdown = await db
      .select({
        category: transactions.category,
        total: sum(transactions.amount),
        percentage: sql<number>`ROUND((SUM(${transactions.amount}) * 100.0 /
          (SELECT SUM(amount) FROM ${transactions}
           WHERE user_id = ${userId} AND type = 'expense'
           AND date >= ${sixMonthsAgo.toISOString().split('T')[0]})), 2)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          gte(transactions.date, sixMonthsAgo.toISOString().split('T')[0])
        )
      )
      .groupBy(transactions.category)
      .orderBy(sql`SUM(${transactions.amount}) DESC`)
      .limit(10);

    // Calculate insights
    const amounts = monthlyTrend.map(m => parseFloat(m.total || '0'));
    const avgSpending = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxSpending = Math.max(...amounts);
    const minSpending = Math.min(...amounts);

    return {
      monthlyTrend: monthlyTrend.map(m => ({
        month: m.month,
        total: parseFloat(m.total || '0'),
        transactions: Number(m.count),
      })),
      categoryBreakdown: categoryBreakdown.map(c => ({
        category: c.category || 'Uncategorized',
        total: parseFloat(c.total || '0'),
        percentage: c.percentage,
      })),
      insights: {
        averageMonthlySpending: Math.round(avgSpending * 100) / 100,
        highestMonth: Math.round(maxSpending * 100) / 100,
        lowestMonth: Math.round(minSpending * 100) / 100,
        volatility: Math.round(((maxSpending - minSpending) / avgSpending) * 100),
      },
    };
  } catch (error: any) {
    logger.error('Failed to get spending trends', {
      error: error.message,
      userId,
    });
    throw error;
  }
}

/**
 * Get financial health score (0-100)
 */
export async function getFinancialHealthScore(userId: number) {
  try {
    const thisMonth = new Date();
    const firstDay = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);

    // Get this month's data
    const [spendingResult] = await db
      .select({
        totalExpense: sum(sql`CASE WHEN ${transactions.type} = 'expense' THEN ${transactions.amount} ELSE 0 END`),
        totalIncome: sum(sql`CASE WHEN ${transactions.type} = 'income' THEN ${transactions.amount} ELSE 0 END`),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          gte(transactions.date, firstDay.toISOString().split('T')[0])
        )
      );

    const expense = parseFloat(spendingResult?.totalExpense || '0');
    const income = parseFloat(spendingResult?.totalIncome || '0');

    // Get budgets adherence
    const userBudgets = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId));

    let budgetAdherence = 100;
    if (userBudgets.length > 0) {
      const budgetChecks = await Promise.all(
        userBudgets.map(async (budget) => {
          const [result] = await db
            .select({ total: sum(transactions.amount) })
            .from(transactions)
            .where(
              and(
                eq(transactions.userId, userId),
                eq(transactions.categoryId, budget.categoryId),
                eq(transactions.type, 'expense'),
                gte(transactions.date, firstDay.toISOString().split('T')[0])
              )
            );

          const spent = parseFloat(result?.total || '0');
          const limit = parseFloat(budget.limitAmount);
          return spent <= limit ? 100 : Math.max(0, 100 - ((spent - limit) / limit) * 100);
        })
      );

      budgetAdherence = budgetChecks.reduce((a, b) => a + b, 0) / budgetChecks.length;
    }

    // Calculate scores
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const savingsScore = Math.min(100, Math.max(0, savingsRate * 2)); // 50% savings = 100 score

    const spendingRatio = income > 0 ? (expense / income) * 100 : 100;
    const spendingScore = Math.max(0, 100 - spendingRatio);

    // Final score (weighted average)
    const finalScore = Math.round(
      (budgetAdherence * 0.4) + (savingsScore * 0.3) + (spendingScore * 0.3)
    );

    let rating: 'excellent' | 'good' | 'fair' | 'poor';
    if (finalScore >= 80) rating = 'excellent';
    else if (finalScore >= 60) rating = 'good';
    else if (finalScore >= 40) rating = 'fair';
    else rating = 'poor';

    return {
      score: finalScore,
      rating,
      breakdown: {
        budgetAdherence: Math.round(budgetAdherence),
        savingsRate: Math.round(savingsRate * 10) / 10,
        spendingRatio: Math.round(spendingRatio),
      },
      metrics: {
        monthlyIncome: income,
        monthlyExpense: expense,
        monthlySavings: income - expense,
      },
    };
  } catch (error: any) {
    logger.error('Failed to calculate financial health score', {
      error: error.message,
      userId,
    });
    throw error;
  }
}
