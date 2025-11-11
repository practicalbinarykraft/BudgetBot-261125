import { Router } from "express";
import { storage } from "../storage";
import { withAuth } from "../middleware/auth-utils";
import { generateForecast } from "../services/forecast.service";
import { generateDateRange } from "../lib/charts/chart-formatters";

const router = Router();

interface TrendDataPoint {
  date: string;
  income: number;
  expense: number;
  capital: number;
  isToday: boolean;
  isForecast: boolean;
}

/**
 * GET /api/analytics/trend
 * Returns financial trend data (historical + forecast)
 * 
 * Query params:
 * - historyDays: number of historical days (default: 30)
 * - forecastDays: number of forecast days (default: 365)
 */
router.get("/trend", withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Parse query params
    const historyDays = parseInt(req.query.historyDays as string) || 30;
    const forecastDays = parseInt(req.query.forecastDays as string) || 365;

    // Get user settings for API key
    const settings = await storage.getSettingsByUserId(userId);
    const apiKey = settings?.anthropicApiKey;

    // Get all transactions
    const transactions = await storage.getTransactionsByUserId(userId);
    
    // Get wallets for current capital
    const wallets = await storage.getWalletsByUserId(userId);
    const currentCapital = wallets.reduce(
      (sum, w) => sum + parseFloat(w.balanceUsd as unknown as string || "0"),
      0
    );

    // Calculate date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    const historyStart = new Date(today);
    historyStart.setDate(today.getDate() - historyDays);

    // Generate historical data
    const dateRange = generateDateRange(historyStart, today);
    const historicalData: TrendDataPoint[] = [];

    let runningCapital = 0; // We'll calculate from the start of history

    for (const dateStr of dateRange) {
      const dayTransactions = transactions.filter(t => t.date === dateStr);
      
      const dayIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amountUsd as unknown as string), 0);
      
      const dayExpense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amountUsd as unknown as string), 0);

      runningCapital += dayIncome - dayExpense;

      historicalData.push({
        date: dateStr,
        income: dayIncome,
        expense: dayExpense,
        capital: runningCapital,
        isToday: dateStr === todayStr,
        isForecast: false,
      });
    }

    // Adjust to current capital (last day should match wallet balance)
    const capitalAdjustment = currentCapital - runningCapital;
    historicalData.forEach(d => {
      d.capital += capitalAdjustment;
    });

    // Generate forecast data
    let forecastData: TrendDataPoint[] = [];
    
    if (apiKey && forecastDays > 0) {
      try {
        const forecast = await generateForecast(
          userId,
          apiKey,
          forecastDays,
          currentCapital
        );

        forecastData = forecast.map(f => ({
          date: f.date,
          income: f.predictedIncome,
          expense: f.predictedExpense,
          capital: f.predictedCapital,
          isToday: false,
          isForecast: true,
        }));
      } catch (error: any) {
        console.error("Forecast generation failed:", error.message);
        // Return without forecast if AI fails
      }
    }

    // Combine historical + forecast
    const trendData = [...historicalData, ...forecastData];

    res.json(trendData);
  } catch (error: any) {
    console.error("Trend data error:", error);
    res.status(500).json({ error: error.message });
  }
}));

export default router;
