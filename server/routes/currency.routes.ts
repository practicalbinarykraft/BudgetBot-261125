/**
 * Currency Routes
 * 
 * Endpoints for currency exchange rates and wallet balance conversion.
 * All endpoints return data in JSON format.
 * 
 * Base path: /api
 * 
 * Routes:
 * - GET  /exchange-rates         - Get current exchange rates with cache info
 * - POST /wallets/refresh-rates  - Refresh USD balances for all user wallets
 */

import { Router } from "express";
import { storage } from "../storage";
import { getExchangeRateInfo, convertToUSD } from "../services/currency-service";
import { withAuth } from "../middleware/auth-utils";
import { cache } from "../lib/redis";
import { getRateHistory, getAllRatesHistory } from "../services/currency-update.service";
import { z } from "zod";
import { getErrorMessage } from "../lib/errors";

const router = Router();

// GET /api/exchange-rates
router.get("/exchange-rates", async (req, res) => {
  try {
    const rateInfo = await getExchangeRateInfo();
    res.json(rateInfo);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// POST /api/wallets/refresh-rates
router.post("/wallets/refresh-rates", withAuth(async (req, res) => {
  try {
    const walletsResult = await storage.getWalletsByUserId(req.user.id);
    const wallets = walletsResult.wallets;

    // Update each wallet's USD balance
    const updates = wallets.map(async (wallet) => {
      const balance = parseFloat(wallet.balance);
      const currency = wallet.currency || "USD";
      
      // Calculate USD balance
      const balanceUsd = currency !== "USD"
        ? convertToUSD(balance, currency).toFixed(2)
        : balance.toFixed(2);
      
      // Update wallet with new USD balance
      await storage.updateWallet(wallet.id, { balanceUsd });
      
      return {
        id: wallet.id,
        name: wallet.name,
        balance: wallet.balance,
        currency,
        balanceUsd,
      };
    });
    
    const updatedWallets = await Promise.all(updates);

    // Invalidate wallets cache since balances were updated
    await cache.del(`wallets:user:${req.user.id}`);

    res.json({
      message: "Wallet balances refreshed successfully",
      wallets: updatedWallets,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
}));

// GET /api/exchange-rates/history/:currencyCode
router.get("/exchange-rates/history/:currencyCode", async (req, res) => {
  try {
    const { currencyCode } = req.params;
    const { days, limit } = req.query;

    // Validate query parameters
    const querySchema = z.object({
      days: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
    });

    const validated = querySchema.safeParse({ days, limit });
    if (!validated.success) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }

    const history = await getRateHistory({
      currencyCode: currencyCode.toUpperCase(),
      days: days ? parseInt(String(days)) : undefined,
      limit: limit ? parseInt(String(limit)) : undefined,
    });

    res.json({
      currencyCode: currencyCode.toUpperCase(),
      history,
      count: history.length,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

// GET /api/exchange-rates/history
router.get("/exchange-rates/history", async (req, res) => {
  try {
    const { days, limit } = req.query;

    // Validate query parameters
    const querySchema = z.object({
      days: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
    });

    const validated = querySchema.safeParse({ days, limit });
    if (!validated.success) {
      return res.status(400).json({ error: "Invalid query parameters" });
    }

    const history = await getAllRatesHistory({
      days: days ? parseInt(String(days)) : undefined,
      limit: limit ? parseInt(String(limit)) : undefined,
    });

    // Group by currency code
    const grouped = history.reduce((acc, entry) => {
      if (!acc[entry.currencyCode]) {
        acc[entry.currencyCode] = [];
      }
      acc[entry.currencyCode].push(entry);
      return acc;
    }, {} as Record<string, typeof history>);

    res.json({
      history: grouped,
      count: history.length,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
});

export default router;
