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

const router = Router();

// GET /api/exchange-rates
router.get("/exchange-rates", async (req, res) => {
  try {
    const rateInfo = await getExchangeRateInfo();
    res.json(rateInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/wallets/refresh-rates
router.post("/wallets/refresh-rates", withAuth(async (req, res) => {
  try {
    const wallets = await storage.getWalletsByUserId(req.user.id);
    
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
    res.json({
      message: "Wallet balances refreshed successfully",
      wallets: updatedWallets,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

export default router;
