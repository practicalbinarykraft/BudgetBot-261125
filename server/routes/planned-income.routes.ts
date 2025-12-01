import { Router } from "express";
import { storage } from "../storage";
import { insertPlannedIncomeSchema, insertTransactionSchema } from "@shared/schema";
import { withAuth } from "../middleware/auth-utils";
import { convertToUSD, getUserExchangeRates } from "../services/currency-service";

const router = Router();

router.get("/", withAuth(async (req, res) => {
  try {
    const status = req.query.status as string | undefined;
    const planned = await storage.getPlannedIncomeByUserId(
      req.user.id,
      status ? { status } : undefined
    );
    res.json(planned);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

router.post("/", withAuth(async (req, res) => {
  try {
    const { userId: _ignoreUserId, ...bodyWithoutUserId } = req.body;
    const data = insertPlannedIncomeSchema.parse(bodyWithoutUserId);
    
    const rates = await getUserExchangeRates(req.user.id);
    const amountUsd = convertToUSD(
      parseFloat(data.amount),
      data.currency || "USD",
      rates
    );
    
    const plannedItem = await storage.createPlannedIncome({
      ...data,
      amountUsd: amountUsd.toString(),
      userId: req.user.id,
    } as any);
    res.json(plannedItem);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

router.patch("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedIncomeById(id);
    if (!plannedItem || plannedItem.userId !== req.user.id) {
      return res.status(404).json({ error: "Planned income not found" });
    }
    
    const { userId, ...sanitizedBody } = req.body;
    const data = insertPlannedIncomeSchema.partial().parse(sanitizedBody);
    
    const updateData: Record<string, any> = {};
    
    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] !== undefined) {
        updateData[key] = data[key as keyof typeof data];
      }
    });
    
    if (data.amount !== undefined || data.currency !== undefined) {
      const amount = data.amount ? parseFloat(data.amount) : parseFloat(plannedItem.amount);
      const currency = data.currency || plannedItem.currency || "USD";
      
      const rates = await getUserExchangeRates(req.user.id);
      const amountUsd = convertToUSD(amount, currency, rates);
      updateData.amountUsd = amountUsd.toString();
    }
    
    const updated = await storage.updatePlannedIncome(id, updateData);
    
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

router.delete("/:id", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedIncomeById(id);
    if (!plannedItem || plannedItem.userId !== req.user.id) {
      return res.status(404).json({ error: "Planned income not found" });
    }
    await storage.deletePlannedIncome(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

router.post("/:id/receive", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedIncomeById(id);
    
    if (!plannedItem || plannedItem.userId !== req.user.id) {
      return res.status(404).json({ error: "Planned income not found" });
    }
    
    if (plannedItem.status !== "pending") {
      return res.status(400).json({ error: "Only pending income can be received" });
    }
    
    const walletsResult = await storage.getWalletsByUserId(req.user.id);
    const wallets = walletsResult.wallets;
    const primaryWallet = wallets.find(w => w.type === "card") || wallets[0];
    
    const transactionData = insertTransactionSchema.parse({
      userId: req.user.id,
      date: new Date().toISOString().split('T')[0],
      type: "income",
      amount: plannedItem.amount,
      description: plannedItem.description,
      categoryId: plannedItem.categoryId,
      currency: plannedItem.currency || "USD",
      amountUsd: plannedItem.amountUsd,
      walletId: primaryWallet?.id || null,
      source: "manual",
    });
    
    const transaction = await storage.createTransaction(transactionData);
    
    if (primaryWallet) {
      const currentBalanceUsd = parseFloat(primaryWallet.balanceUsd || primaryWallet.balance);
      const newBalanceUsd = currentBalanceUsd + parseFloat(plannedItem.amountUsd);
      
      const walletCurrency = primaryWallet.currency || "USD";
      const isSameCurrency = walletCurrency === (plannedItem.currency || "USD");
      
      if (isSameCurrency) {
        const currentBalance = parseFloat(primaryWallet.balance);
        const newBalance = currentBalance + parseFloat(plannedItem.amount);
        await storage.updateWallet(primaryWallet.id, {
          balance: newBalance.toFixed(2),
          balanceUsd: newBalanceUsd.toFixed(2),
        });
      } else {
        await storage.updateWallet(primaryWallet.id, {
          balanceUsd: newBalanceUsd.toFixed(2),
        });
      }
    }
    
    await storage.updatePlannedIncome(id, {
      status: "received",
      receivedAt: new Date(),
      transactionId: transaction.id,
    } as any);
    
    const updated = await storage.getPlannedIncomeById(id);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

router.post("/:id/cancel", withAuth(async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const plannedItem = await storage.getPlannedIncomeById(id);
    
    if (!plannedItem || plannedItem.userId !== req.user.id) {
      return res.status(404).json({ error: "Planned income not found" });
    }
    
    if (plannedItem.status !== "pending") {
      return res.status(400).json({ error: "Only pending income can be cancelled" });
    }
    
    await storage.updatePlannedIncome(id, { status: "cancelled" });
    const updated = await storage.getPlannedIncomeById(id);
    
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

export default router;
