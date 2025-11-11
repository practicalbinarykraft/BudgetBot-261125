import { Router } from "express";
import { storage } from "../storage";
import { insertWalletSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { convertToUSD } from "../services/currency-service";
import { calibrateWallet } from "../services/calibration.service";

const router = Router();

// GET /api/wallets
router.get("/", withAuth(async (req, res) => {
  try {
    const wallets = await storage.getWalletsByUserId(req.user.id);
    res.json(wallets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/wallets
router.post("/", withAuth(async (req, res) => {
  try {
    let data = insertWalletSchema.parse({
      ...req.body,
      userId: req.user.id,
    });
    
    // 💱 Multi-currency: Calculate USD equivalent for non-USD wallets
    if (data.currency && data.currency !== "USD") {
      const balanceAmount = parseFloat(data.balance);
      const balanceUsdValue = convertToUSD(balanceAmount, data.currency);
      data = { ...data, balanceUsd: balanceUsdValue.toFixed(2) };
    } else {
      // USD wallet - balanceUsd = balance
      data = { ...data, balanceUsd: data.balance };
    }
    
    const wallet = await storage.createWallet(data);
    res.json(wallet);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// PATCH /api/wallets/:id
router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wallet = await storage.getWalletById(id);
    if (!wallet || wallet.userId !== req.user.id) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    
    // 🔒 Security: Strip userId from client
    const { userId, ...sanitizedBody } = req.body;
    let data = insertWalletSchema.partial().parse(sanitizedBody);
    
    // 💱 Multi-currency: Recompute balanceUsd if balance or currency changed
    if (data.balance || data.currency) {
      const balance = data.balance ? parseFloat(data.balance) : parseFloat(wallet.balance);
      const currency = data.currency || wallet.currency || "USD";
      
      if (currency !== "USD") {
        const balanceUsdValue = convertToUSD(balance, currency);
        data = { ...data, balanceUsd: balanceUsdValue.toFixed(2) };
      } else {
        data = { ...data, balanceUsd: balance.toFixed(2) };
      }
    }
    
    const updated = await storage.updateWallet(id, data);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// DELETE /api/wallets/:id
router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const wallet = await storage.getWalletById(id);
    if (!wallet || wallet.userId !== req.user.id) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    await storage.deleteWallet(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// POST /api/wallets/:id/calibrate
router.post("/:id/calibrate", withAuth(async (req, res) => {
  try {
    const userId = req.user.id;
    const walletId = parseInt(req.params.id);
    const { actualBalance } = req.body;
    
    if (actualBalance === undefined || actualBalance === null || Number.isNaN(Number(actualBalance))) {
      return res.status(400).json({ error: 'actualBalance required' });
    }
    
    const result = await calibrateWallet(
      userId,
      walletId,
      parseFloat(actualBalance)
    );
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Calibration failed' 
    });
  }
}));

export default router;
